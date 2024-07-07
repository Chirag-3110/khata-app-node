const constants = {
    success: {
      profileUpdated: 'Profile updated successfully',
      registeredUserSuccessfully: 'User registered successfully',
      tokenUpdated: 'Device registered or FCM token updated successfully',
      logoutSuccessfully: 'Successfully logged out',
      notificationSuccessfully:"Successfully trigger notification",
      notificatinoStatusUpdatedSuccessfully:"Successfully updated the notification",
      deletedNotification:"Successfully deleted notification"
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

export { constants,roles,NOTIFICATION_TYPE,NOTIFICATION_STATUS }