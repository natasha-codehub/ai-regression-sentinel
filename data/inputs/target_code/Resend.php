<?php

namespace Venture7\AdminOtp2FA\Controller\Adminhtml\Verify;

use Magento\Backend\App\Action;
use Magento\Backend\Model\Auth\Session as AdminSession;
use Venture7\AdminOtp2FA\Model\OtpFactory;
use Magento\Framework\Mail\Template\TransportBuilder;

class Resend extends Action
{
    protected $adminSession;
    protected $otpFactory;
    protected $transportBuilder;

    public function __construct(
        Action\Context $context,
        AdminSession $adminSession,
        OtpFactory $otpFactory,
        TransportBuilder $transportBuilder
    ) {
        parent::__construct($context);
        $this->adminSession = $adminSession;
        $this->otpFactory = $otpFactory;
        $this->transportBuilder = $transportBuilder;
    }

    /**
     * Generate & Send New OTP
     */
    public function execute()
    {
        $otpRecordId = $this->adminSession->getOtpRecordId();

        if (!$otpRecordId) {
            $this->messageManager->addErrorMessage("Session expired. Please login again.");
            return $this->_redirect('admin');
        }

        /** Load existing OTP */
        $otpModel = $this->otpFactory->create()->load($otpRecordId);

        if (!$otpModel || !$otpModel->getId()) {
            $this->messageManager->addErrorMessage("Invalid session. Please login again.");
            return $this->_redirect('admin');
        }

        $user = $this->adminSession->getUser();
        if (!$user) {
            $this->messageManager->addErrorMessage("User session expired.");
            return $this->_redirect('admin');
        }

        /** Create new OTP */
        $newOtp = rand(100000, 999999);
        $newExpiry = date("Y-m-d H:i:s", time() + 180); // 3 mins

        /** Update OTP record */
        $otpModel->setOtpCode($newOtp)
                 ->setExpiresAt($newExpiry)
                 ->setStatus('pending')
                 ->save();

        /** Send Email */
        $transport = $this->transportBuilder
            ->setTemplateIdentifier('admin_otp_email_template')
            ->setTemplateOptions(['area' => 'frontend', 'store' => 1])
            ->setTemplateVars(['otp' => $newOtp, 'username' => $user->getUsername()])
            ->setFrom('general')
            ->addTo($user->getEmail())
            ->getTransport();

        $transport->sendMessage();

        $this->messageManager->addSuccessMessage("A new OTP has been sent to your email.");

        return $this->_redirect('adminotp/verify/index');
    }
}
