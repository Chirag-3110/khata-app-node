const JWT_SECRET = 'khatak_app'
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

export function generateJWT(user: any,documentId: any) {
    const secretKey = JWT_SECRET || '1234';
    return jwt.sign(
      {
        userId: user,
        documentId: documentId
      },
      secretKey
    );
}

export const generateOTP = async () => {
  const otp = otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });
  return otp;
};