<?php
namespace Venture7\BusinessAccount\Controller\Index;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\InputException;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Customer\Model\Session;
use Magento\Customer\Model\Customer;
use Psr\Log\LoggerInterface;
use Venture7\BusinessAccount\Model\OnboardingProcess;

class Save extends \Magento\Framework\App\Action\Action
{
    /**
     * @var JsonFactory
     */
    private $jsonResultFactory;

    /**
     * @var Validator
     */
    private $formKeyValidator;
	
	/**
     * @var Session
     */
	private $session;
	
	/**
     * @var Customer
     */
	private $customer;

	/**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @var OnboardingProcess
     */
    private $onboardingProcess;

	public function __construct(
        Context $context,
        JsonFactory $jsonResultFactory,
        Validator $formKeyValidator,
        Session $session,
		Customer $customer,
		LoggerInterface $logger,
		OnboardingProcess $onboardingProcess
    ) {
        parent::__construct($context);
        $this->formKeyValidator = $formKeyValidator;
        $this->jsonResultFactory = $jsonResultFactory;
        $this->session = $session;
        $this->customer = $customer;
		$this->logger = $logger;
		$this->onboardingProcess = $onboardingProcess;
    }

    public function execute()
    {
        $validFormKey = $this->formKeyValidator->validate($this->getRequest());
        $response = [];

        if(!$this->session->isLoggedIn()) {
        	$resultRedirect = $this->resultRedirectFactory->create();
			return $resultRedirect->setPath('customer/account/login');
		}

		try {
	        if ($this->getRequest()->isPost()) {
				$formData = $this->getRequest()->getPostValue();
                // echo json_encode($formData);die;

                if (empty($formData['group_id'])) {
                    $formData['group_id'] = $this->session->getCustomer()->getGroupId();
                }

                $this->logger->info('[ONBOARDING SAVE] Raw POST Data');
                $this->logger->info(print_r($formData, true));

				$response = $this->onboardingProcess->execute($formData);

                // BEV-2937 If bpref_id is present, update bp_ref table status
                // if (!empty($formData['bpref_id'])) {
                //     $bprefId = (int) $formData['bpref_id'];
                    
                //     $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
                //     $connection = $objectManager->get(\Magento\Framework\App\ResourceConnection::class)->getConnection();
                    
                //     $connection->update(
                //         $connection->getTableName('bp_ref'),
                //         ['status' => 1],
                //         ['entity_id = ?' => $bprefId]
                //     );
                // }
	        }
    	}
    	catch (\Exception $e) {
    		$this->logger->info($e->getMessage());
    	}

        $result = $this->jsonResultFactory->create();
	    return $result->setData($response);
    }
}
