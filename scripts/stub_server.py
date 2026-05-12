#!/usr/bin/env python3
"""
Sentinel stub HTTP server — mimics the Magento REST API for PHPUnit execution.

Reads stub_mode from data/inputs/target_code/stub_mode.txt on every request:
  "normal"  — MOQ enforced, sf_case_id populated  (tests should PASS)
  "broken"  — MOQ disabled, sf_case_id null        (regression tests should FAIL)

Run:  python scripts/stub_server.py
Port: 8080
"""

import threading
from pathlib import Path

from flask import Flask, jsonify, make_response, request

BASE_DIR = Path(__file__).parent.parent
STUB_MODE_FILE = BASE_DIR / "data" / "inputs" / "target_code" / "stub_mode.txt"

# MOQ rules per SKU; anything not listed defaults to 1
MOQ_CONFIG = {
    "CO2-CYLINDER-20LB": 2,
    "N2-MOQ1-CYLINDER":  1,
}
DEFAULT_MOQ = 1

VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token"
OPEN_ORDER_CARD = "pm_test_open_order"

app = Flask(__name__)

# Global cart — tests run sequentially so no concurrency risk
_cart: dict[str, int] = {}
_order_counter = 50290
_lock = threading.Lock()


# ── helpers ──────────────────────────────────────────────────────────────────

def get_mode() -> str:
    try:
        return STUB_MODE_FILE.read_text(encoding="utf-8").strip().lower()
    except FileNotFoundError:
        return "normal"


def bearer() -> str | None:
    auth = request.headers.get("Authorization", "")
    return auth[7:] if auth.startswith("Bearer ") else None


def next_order_id() -> int:
    global _order_counter
    with _lock:
        _order_counter += 1
        return _order_counter


# ── authentication ────────────────────────────────────────────────────────────

@app.route("/rest/V1/integration/customer/token", methods=["POST"])
def get_token():
    return jsonify(VALID_TOKEN), 200


# ── business account / onboarding ─────────────────────────────────────────────
# Guzzle follows 302 redirects by default, so we return 401 (not 302) for
# unauthenticated requests — the test accepts either value.

@app.route("/businessaccount/index/save", methods=["POST"])
def onboarding_save():
    if not bearer():
        return jsonify({"message": "Authentication required"}), 401
    return jsonify({"success": True, "message": "Account saved"}), 200


# ── cart ──────────────────────────────────────────────────────────────────────

@app.route("/rest/V1/carts/mine/items", methods=["POST"])
def add_to_cart():
    data = request.get_json(force=True, silent=True) or {}
    item = data.get("cartItem", {})
    sku  = item.get("sku", "UNKNOWN")
    qty  = int(item.get("qty", 1))
    _cart[sku] = _cart.get(sku, 0) + qty
    return jsonify({
        "item_id": 91,
        "sku":     sku,
        "qty":     qty,
        "price":   34.99,
        "moq_configured": MOQ_CONFIG.get(sku, DEFAULT_MOQ),
    }), 200


@app.route("/rest/V1/carts/mine", methods=["DELETE"])
def clear_cart():
    _cart.clear()
    return jsonify(True), 200


@app.route("/rest/V1/carts/mine", methods=["GET"])
def get_cart():
    items = [{"sku": s, "qty": q, "price": 34.99} for s, q in _cart.items()]
    return jsonify({
        "id":          "cart_stub",
        "items":       items,
        "items_count": len(items),
        "grand_total": sum(i["price"] * i["qty"] for i in items),
    }), 200


# ── place order ───────────────────────────────────────────────────────────────

@app.route("/rest/V1/carts/mine/payment-information", methods=["POST"])
def place_order():
    if not bearer():
        return jsonify({"message": "Unauthorized"}), 401

    mode = get_mode()

    if mode == "normal":
        for sku, qty in _cart.items():
            moq = MOQ_CONFIG.get(sku, DEFAULT_MOQ)
            if qty < moq:
                return jsonify({
                    "message": (
                        f"Minimum order quantity for {sku} is {moq}. "
                        f"You ordered {qty}. Please increase the quantity."
                    ),
                    "code": "MOQ_VIOLATION",
                }), 422

    order_id = next_order_id()
    _cart.clear()
    # Return a bare integer — matches what tests assert with assertIsInt()
    return jsonify(order_id), 200


# ── order details ─────────────────────────────────────────────────────────────

@app.route("/rest/V1/orders/<int:order_id>", methods=["GET"])
def get_order(order_id: int):
    mode = get_mode()
    sf_case_id = None if mode == "broken" else f"SF-CASE-{order_id}"
    return jsonify({
        "entity_id":              order_id,
        "increment_id":           f"10{order_id}",
        "status":                 "pending",
        "customer_email":         "primary.user@esprigas.com",
        "nav_order_id":           f"NAV-ORD-{order_id}",
        "sf_case_id":             sf_case_id,
        "sf_case_creation_status": "created" if sf_case_id else "failed",
    }), 200


# ── payment methods ───────────────────────────────────────────────────────────

@app.route("/rest/V1/carts/mine/payment-methods", methods=["GET"])
def payment_methods():
    return jsonify([
        {"code": "stripe_cc", "title": "Credit / Debit Card (Stripe)"},
        {"code": "invoice",   "title": "Net 30 Invoice"},
    ]), 200


@app.route("/stripe/customer/paymentmethods", methods=["GET"])
def stripe_payment_methods():
    # Returning 200 with an error body — Guzzle would follow a 302 redirect,
    # and the test accepts [200, 302], so 200 satisfies the assertion.
    delete_token = request.args.get("delete")
    if delete_token == OPEN_ORDER_CARD:
        return jsonify({
            "message": (
                "Sorry, it is not possible to delete this payment method "
                "because an order placed using it is still being processed."
            ),
            "error": True,
        }), 200
    return jsonify([{"id": "pm_stub_1", "code": "4242"}]), 200


# ── admin OTP ─────────────────────────────────────────────────────────────────
# Return 403 (not 302) — Guzzle follows redirects by default and the test
# accepts [302, 403].  403 is semantically correct for missing session anyway.

@app.route("/adminotp/verify/resend", methods=["GET"])
def adminotp_resend():
    cookie_header = request.headers.get("Cookie", "")
    # Valid session: Cookie header contains admin_session=<non-empty, non-'invalid'>
    if "admin_session=" in cookie_header:
        session_val = cookie_header.split("admin_session=")[-1].split(";")[0].strip()
        if session_val and session_val not in ("", "invalid"):
            resp = make_response("", 302)
            resp.headers["Location"] = "/adminotp/verify/index"
            return resp
    return jsonify({"message": "Session expired or not found"}), 403


# ── shipping (not directly tested but avoids 404 noise) ──────────────────────

@app.route("/rest/V1/carts/mine/shipping-methods", methods=["GET"])
def shipping_methods():
    return jsonify([
        {"carrier_code": "standard", "method_code": "standard",
         "carrier_title": "Standard Delivery", "amount": 0.0, "available": True},
    ]), 200


@app.route("/rest/V1/carts/mine/shipping-information", methods=["POST"])
def set_shipping():
    return jsonify({
        "payment_methods": ["stripe_cc", "invoice"],
        "totals": {"grand_total": 34.99},
    }), 200


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mode = get_mode()
    print(f"Sentinel stub server  →  http://localhost:8080  [mode: {mode}]")
    print(f"Mode file: {STUB_MODE_FILE}")
    print("Ctrl-C to stop\n")
    app.run(host="0.0.0.0", port=8080, debug=False)
