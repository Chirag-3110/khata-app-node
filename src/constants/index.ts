const constants = {
    success: {
      profileUpdated: 'Profile updated successfully',
      registeredUserSuccessfully: 'User registered successfully',
      tokenUpdated: 'Device registered or FCM token updated successfully',
      logoutSuccessfully: 'Successfully logged out',
      notificationSuccessfully:"Successfully trigger notification",
      notificatinoStatusUpdatedSuccessfully:"Successfully updated the notification",
      deletedNotification:"Successfully deleted notification",
      customerAdded:"New customer added successfully",
      customerDeleted:"Customer deleted successfully",
      transactionDone:"Transaction is completed successfully",
      transactionStatusUpdate:"Transaction status is updated",
      transactionDueDateUpdate:"Transaction due date requested is accepted",
      reviewAddedSuccessfully:"Review Added Successfully",
      reminderAddedSuccess:"Reminder added successfully",
      transactionStatusUpdated:"Transaction status updated successfully",
      shopStatusChanged:"Shop Status Changed",
      userDeactivated:"User is deactivated",
      userActivated:"User is activated",
      dueDateRequested:"Due date update is requested",
      transactionDueDateReject:"Transaction due date requested is rejected",
      transactionSuccesfullStarted:"Transaction successfully started",
      deleteAllNoti:"All notifications are deleted",
      userProfileUpdate:"User profile updated successfully",
      shopProfileUpdate:"Shop updated successfully",
      enquiryAdded:"Enquiry added successfully",
      enquiryReopen:"Enquiry reopened successfully",
      enquiryClosed:"Enquiry closed successfully",
      bulkRemindersAddedSuccess:"We have notified to all the users related to selected transaction",
      fraudNotExeedsLimit:"Customer fraud limit not exceeds, so customer is not blocked at this moment",
      fraudUserBlock:"Customer is blocked successfully.",
      customersReactivated:"Customer is reactivated",
      categoryAdded:"Category created successfully",
      categoryUpdate:"Category updated successfully",
      categoryDelete:"Category deleted successfully",
      testNotificaiton:"Test notification send",
      otpSendSuccessfull:"Otp send successfully",
      ssAddedSuccess:"Image added successfully",
      subsAdded:"New subscription added successfully",
    },
    errors: {
      roleNotFound:"Role not found",
      pinCodeRequired:"Security pin code is required",
      userAlreadyExists: 'User already exists',
      invalidUserId: 'User id is invalid',
      userNotFound: 'User not found',
      invalidEmail: 'Invalid email',
      emailAlreadyExist: 'Email already exists',
      internalServerError: 'Internal server error',
      docIdNotgExists:"Firebase document id is not exists",
      invalidNotificationId: 'Invalid notification ID',
      notificationNotFound: 'Notification not found',
      phoneNotExists: 'Phone number not exists',
      customerNotExists:"Customer not exists",
      invalidCustomer:"Invalid customer Id",
      customerAlreadyAdded:"Customer already added by you",
      roleRequired:"Role is required",
      amountRequired:"Amount is required",
      transactionNotFound:"Transaction not found",
      invalidTransactionId:"Invalid transaction Id",
      transactionDueDateUpdate:"Transaction due date is already updated once by you",
      cannotDoMorePartial:"Cannot do more partial payments",
      transactionIsCompleted:"Transaction is already completed",
      invalidPhone:"Invalid Phone number",
      shopIdInvalid:"Invalid Shop Id",
      ratingDescription:"Rating description is required",
      ratingError:"Rating value is requred",
      reminderDataReqired:"Reminder date is required",
      reminderTypeRequired:"Reminder type is required",
      errorUpdateTransaction:"Transaction status is not updated",
      userNotVender:"User is not vender type",
      shopNotFound:"Shop not found",
      invalidDueDate:"Invalid due date",
      statusRequired:"Status is required",
      reviewAlreadyExists:"Review is already given to this shop",
      unableToChange:"Unable to change status of transaction",
      emptyOtp:"Empty otp",
      invalidOtp:"Invalid OTP",
      reminderAlreadyExists:"You have already notified for selected transaction to customer",
      deviceIdRequired:"Device ID is required",
      invalidRequest:"Invalid request",
      enquiryIdNotValid:"Enquiry id not valid",
      enquiryNotFound:"Enquiry not found",
      transactionsArrayRequired:"Requires atleast one transaction",
      noCategory:"Category not exists",
      cannotAddSelf:"Cannot add self",
      redeemCodeError:"Redeem code is invalid",
      venderRole:"Vender role is required",
      customerRole:"Customer role is required",
      customerBlocked:"Customer is blocked because of declaration of fraud by several venders",
      fraudsterInvlidId:"Invalid fraudster Id",
      fraudAddUser:"Invalid fraud add by user id",
      fraudAlreadyExistsForTransaction:"Fraud is already given by you for this transaction",
      invalidFraudId:"Invalid fraud Id",
      fraudNotFound:"Fraud not found",
      userDeactivated:"User is deacticated",
      cantMarkFraud:"You can't make this customer as a fraud customer",
      coordinatesRequired:"Shop location coordinated required" ,
      categoryAlreadyExists:"Category already exists",
      categoryNotFound:"Category not found",
      unableToSendOtp:"Unable to send otp",
      sessionIdReq:"Session id is required",
      otpMisMatch:"OTP Mismatch",
      invalidPaymentImage:"Image not found",
      transactionIsInPendingState:"Customer has not made payment yet so you can not complete the transaction",
      subscrionNotFound:"Subscription not found",
      shopUpdateFailed:"Shop subscription failed to update"
    },
};

const roles={
  Customer:"CUSTOMER",
  Vender:"VENDER"
}

const NOTIFICATION_TYPE={
  REMINDER:"REMINDER",
  TRANSACTION:"TRANSACTION",
  REVIEW:"REVIEW",
  ENQUIRY:"ENQUIRY",
  FRAUD:"FRAUD"
}

const NOTIFICATION_STATUS={
  UNSEEN:"Unseen",
  SEEN:"Seen"
}

const TRANSACTION_STATUS={
  PENDING:"Pending",
  COMPLETE:"Completed",
  PARTIAL_DONE:"PartialDone",
  CUSTOMER_PAID:"CustomerPaidFull",
  CUSTOMER_PAID_PARTIAL:"CustomerPaidPartial",
  PRE_PENDING:"PrePending"
}

const TRANSACTION_TYPE={
  PARENT:"PARENT",
  CHILD:"CHILD"
}

const DUE_DATE_STATUS={
  ACCEPT:"accept",
  REJECT:"reject",
  REQUESTED:"requested",
  PENDING:"pending"
}

const WALLET_TRANSACTION_TYPE={
  WITHDRAW:"withdraw",
  DEPOSIT:"deposit"
}

const TRANSACTION_MODULES={
  TRANSACTION:"TRANSACTION",
  REDEEM:"REDEEM"
}

const ENQUIRY_STATUS={
  OPEN:"Open",
  CLOSE:"Close",
  REOPEN:"Reopen"
}

const CATEGORY_TYPE={
  ENQUIRY:"Enquiry",
  REGISTER:"Register"
}

const CREDIT_SCORE={
  NEUTRAL: "Neutral",
  GOOD: "Good",
  EXCELLENT: "Excellcent",
  BAD: "Bad",
  VERY_BAD: "Very Bad"
}

const FIREBASE_NOTIFICATION_MESSAGES={ 
  transaction:{
    type:"TRANSACTION_CREATED",
    message:"New transaction is created by {{userName}} with {{otp}}"
  },
  transaction_verify:{
    type:"TRANSACTION_VERIFIED",
    message:"Merchant {{venderName}} Store recorded a ₹{{amount}} credit entry for your purchase/service. Click to view more details. ",
    secondMessage:"{{customerName}} has created a credit entry of ₹{{amount}}. Tap here to review the details."
  },
  transaction_request:{
    type:"TRANSACTION_REQUEST",
    message:"You’ve received a due date extension request from {{userName}} for their pending payment of ₹{{amount}}. Tap here to review and respond."
  },
  transaction_request_response:{
    type:"TRANSACTION_REQUEST_ACCEPT_REJECT",
    message:"Due date request has been {{request}}."
  },
  transaction_status_update:{
    type:"TRANSACTION_STATUS_UPDATED",
    message:"{{venderName}} has marked your ₹{{amount}} payment as paid. Thank you! Tap here to view the details."
  },
  transaction_amount_pay:{
    type:"TRANSACTION_PAYMENT",
    message:"{{amount}} has been recieved from {{userName}}"
  },
  review:{
    type:"REVIEW",
    message:"{{shopUser}} has shared their feedback about you. Tap here to view their review",
    secondMessage:"You’ve received a new review from {{customerName}}. Tap here to read their feedback"
  },
  reminder:{
    type:"REMIDER",
    message:"Reminder from {{shopName}}: This is a gentle reminder to request a pending payment of ₹{{amount}} for your purchase/service is due on {{date}}.Please clear the dues today"
  },
  enquiry_added:{
    type:"ENQUIRY",
    message:"New inquiry received from {{customerName}}. Tap here to view and respond to their query."
  },
  user_onboard:{
    type:"USER_ONBOARD",
    message:"We noticed that you registered for Payru but forgot to complete your profile. Please complete your profile."
  },
  fraud_add:{
    type:"FRAUD_CREATED",
    message:"{{userName}} is marked you as a fraud."
  },
  fraud_blocked_customer:{
    type:"FRAUD_BLOCKED_CUSTOMER",
    message:"{{userName}} is marked you as a fraud and you are blocked for all transactions."
  },
  fraud_blocked_venders:{
    type:"FRAUD_BLOCKED_VENDER",
    message:"{{userName}} is blocked for all transactions. please take actions against the same."
  },
  shopOpenClose:{
    type:"SHOP_OPEN_CLOSE",
    message:"Your shop {{shopName}} is now {{status}}."
  },
}

const OTP_API_KEY="e492e176-7cb7-11ef-8b17-0200cd936042"

const META_DATA={
  TRANS_OTP:"Transaction_Otp"
}

export {OTP_API_KEY,META_DATA,CATEGORY_TYPE,CREDIT_SCORE,FIREBASE_NOTIFICATION_MESSAGES,ENQUIRY_STATUS,constants,roles,NOTIFICATION_TYPE,NOTIFICATION_STATUS,TRANSACTION_STATUS,TRANSACTION_TYPE,DUE_DATE_STATUS,WALLET_TRANSACTION_TYPE,TRANSACTION_MODULES }