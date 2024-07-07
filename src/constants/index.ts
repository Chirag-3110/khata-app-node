const constants = {
    success: {
      profileUpdated: 'Profile updated successfully',
      registeredUserSuccessfully: 'User registered successfully',
      tokenUpdated: 'Device registered or FCM token updated successfully',
      logoutSuccessfully: 'Successfully logged out',
    },
    errors: {
      roleNotFound:"Role not found",
      userAlreadyExists: 'User already exists',
      invalidUserId: 'User id is invalid',
      userNotFound: 'User not found',
      invalidEmail: 'Invalid email',
      emailAlreadyExist: 'Email already exists',
      internalServerError: 'Internal server error',
      docIdNotgExists:"Firebase document id is not exists"
    },
};

const roles={
  Customer:"CUSTOMER",
  Vender:"VENDER"
}

const NOTIFICATION_TYPE={
  REMINDER:"REMINDER"
}

export { constants,roles,NOTIFICATION_TYPE }