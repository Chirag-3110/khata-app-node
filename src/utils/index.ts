import fs from 'fs';
import moment from "moment";
const JWT_SECRET = 'khatak_app'
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
import admin from 'firebase-admin';

try {
  const serviceAccount = JSON.parse(fs.readFileSync('../payru-30bfe-firebase-adminsdk-euzms-1199a3fdd7.json', 'utf8'));
  console.log(serviceAccount,"ASc");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error reading or parsing JSON file:', error);
}

export function generateJWT(user: any, documentId: any) {
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

export function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let referralCode = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  
  return referralCode;
}

export const generateRandomTransactionRef = () => {
  const year = moment().format('YYYY');
  const date = moment().format('DDMMYY');
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const uniqueId = `${year}${date}${randomDigits}`;
  return uniqueId;
}

export const sendNotification = async (title: string, body: string, tokens: string[], data: any = {}) => {
  const stringData: { [key: string]: string } = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      stringData[key] = String(data[key]); 
    }
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: stringData,
    tokens: tokens 
  };

  console.log(message, "message");

  admin.messaging().sendMulticast(message)
    .then((response: any) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error: any) => {
      console.log('Error sending message:', error);
    });
}
