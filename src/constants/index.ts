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
      transactionDueDateUpdate:"Transaction due date updated successfully"
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
      transactionDueDateUpdate:"Transaction due date is already updated once by you"
    },
};

const roles={
  Customer:"CUSTOMER",
  Vender:"VENDER"
}

const NOTIFICATION_TYPE={
  REMINDER:"REMINDER"
}

const NOTIFICATION_STATUS={
  UNSEEN:"Unseen",
  SEEN:"Seen"
}

const TRANSACTION_STATUS={
  PENDING:"Pending",
  COMPLETE:"Completed",
  PARTIAL_DONE:"PartialDone"
}

export { constants,roles,NOTIFICATION_TYPE,NOTIFICATION_STATUS,TRANSACTION_STATUS }