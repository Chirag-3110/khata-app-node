const JWT_SECRET = 'khatak_app'
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
var admin = require("firebase-admin");

// var serviceAccount = require("../payru-30bfe-firebase-adminsdk-euzms-1199a3fdd7.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


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

// export const sendNotification=async(title:string,body:string,tokens:string[],data:any={})=>{
//   const message = {
//     notification: {
//       title: title,
//       body: body,
//     },
//     token: tokens,
//     data:data
//   };
  
//   admin.messaging().send(message)
//     .then((response:any) => {
//       console.log('Successfully sent message:', response);
//     })
//     .catch((error:any) => {
//       console.log('Error sending message:', error);
//     });  
// }