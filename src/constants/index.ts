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
      bulkRemindersAddedSuccess:"Bulk reminders are added successfully"
    },
    errors: {
      roleNotFound:"Role not found",
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
      reminderAlreadyExists:"Today's transaction reminder is already added",
      deviceIdRequired:"Device ID is required",
      invalidRequest:"Invalid request",
      enquiryIdNotValid:"Enquiry id not valid",
      enquiryNotFound:"Enquiry not found",
      transactionsArrayRequired:"Requires atleast one transaction"
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
  ENQUIRY:"ENQUIRY"
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
  TRANSACTION:"TRANSACTION"
}

const ENQUIRY_STATUS={
  OPEN:"Open",
  CLOSE:"Close",
  REOPEN:"Reopen"
}

const FIREBASE_NOTIFICATION_MESSAGES={ 
  transaction:{
    type:"TRANSACTION_CREATED",
    message:"New transaction is created by {{userName}} with {{otp}}"
  },
  transaction_verify:{
    type:"TRANSACTION_VERIFIED",
    message:"The transaction is successfully verified."
  },
  transaction_request:{
    type:"TRANSACTION_REQUEST",
    message:"Due date request has been recieved from {{userName}}."
  },
  transaction_request_response:{
    type:"TRANSACTION_REQUEST_ACCEPT_REJECT",
    message:"Due date request has been {{request}}."
  },
  transaction_status_update:{
    type:"TRANSACTION_STATUS_UPDATED",
    message:"Transaction status is changed by {{venderName}}."
  },
  transaction_amount_pay:{
    type:"TRANSACTION_PAYMENT",
    message:"{{amount}} has been recieved from {{userName}}"
  }
}

export { FIREBASE_NOTIFICATION_MESSAGES,ENQUIRY_STATUS,constants,roles,NOTIFICATION_TYPE,NOTIFICATION_STATUS,TRANSACTION_STATUS,TRANSACTION_TYPE,DUE_DATE_STATUS,WALLET_TRANSACTION_TYPE,TRANSACTION_MODULES }