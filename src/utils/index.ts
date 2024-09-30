import fs from 'fs';
import moment from "moment";
const JWT_SECRET = 'khatak_app'
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
import admin from 'firebase-admin';
// var serviceAccount = require('../payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json');

export const initializeFirebase=async()=>{
  // try {
  //   admin.initializeApp({
  //     credential: admin.credential.cert(serviceAccount)
  //   });
  //   console.log("Firebase initialised")
  // } catch (error) {
  //   console.error('Error reading or parsing JSON file:', error);
  // }
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

  const message = { notification: {title: title,body: body,},data: stringData,tokens: tokens, };

  console.log("Sending message:", message);

  if (tokens.length > 0) {
    // try {
    //   const response = await admin.messaging().sendEachForMulticast(message);
    //   console.log(`Successfully sent message to ${response.successCount} tokens`);
    //   console.log(`Failed to send message to ${response.failureCount} tokens`);

    //   response.responses.forEach((resp, idx) => {
    //     if (resp.success) {
    //       console.log(`Message successfully sent to token ${tokens[idx]}`);
    //     } else {
    //       console.error(
    //         `Failed to send message to token ${tokens[idx]}:`,
    //         resp.error?.message
    //       );
    //     }
    //   });
    // } catch (error:any) {
    //   console.error("Error sending message:", error.message);
    // }
  } else {
    console.log("No tokens available to send the notification.");
  }
};
