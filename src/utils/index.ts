import fs from 'fs';
import moment from "moment";
const JWT_SECRET = 'khatak_app_jwt'
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
import admin from 'firebase-admin';
import axios from 'axios';
import { OTP_API_KEY } from '../constants';
// var serviceAccount = require('../payru-30bfe-firebase-adminsdk-euzms-59a86ed991.json');

export const initializeFirebase=async()=>{
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "payru-30bfe",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVseXXhaDU/XCC\nPFT2LURnjlKmOnKFaqZXjx2qQqw4xsIGveCTWAdmLPGmb5IWDHsJgAkQgK7f8p6d\nMVdG6Wp4myDUIbThU6d7jLDFp6THw76oD/5kwlo/C3YfVF/onui55pXzrNzu14nI\nvHVYyEb3PdDtidTrapeGCQN7QuByTUIr3srNFq/cEo5kN3vIAFCFqre55PTthk4G\nl7+0RU8r+FBAolZZwUObjL1HreAvBA/ukrjoFBafLOSIWkacb2sQClBxRKqYGGRy\nQQWo07pV2e/EgRtfyhSyqnYHqDf1MBAWx/5BLC18zTILzHnlveRO8VwAfHg5AuED\nxTZK1XkhAgMBAAECggEACCscTSpYWR/lcbL+7+iPz3INJnnAOCmZGWp48LHK/cIa\nN1IBgDxajw0rgQhNgh6Awv6UCh+TH7AZYEqbKpSgS2MppHYz4POWyLYaaTnE5pZs\nxqWS3LThqHyGi8DIyD5vyLBf3cBHMzGFvKi4hxfjv45rOrM8snGBAIB+c7MdG31W\n5HH5p369HzA/2m0/zvLyJ+Xf2/7PeT3STb7kgEitPvGrfwqQp/fNLUrIHy8L5BSF\nKLkQkGXp5bNA1p8bH650Nh4aR30Ms+NwgOmng6Q51QnPcq8SNN2pFXRDKI5MtMQs\nGHgJ6jQYO7jfmf9/bFLc2p6n4i7j1d+f3aL93dMymQKBgQDyMZCDeyJogg36dKfC\nvWyO+Yp0fNTGdrb6Fjf5Rtva2/MBj4JnUw+BRPv2EdhWdEHdZAmZceOXxD5reeiD\n60c7DU1UNYONp9AJy1bYEag+IH8SMJimUlDAhoPP0GZiXfZ0rYKdm/KK+X4WzM1s\nKcgfgUJzLL5CkAumwNG452LzyQKBgQDh4HCHHZeuoqZxgVAcWajPMWc++PyqkbT4\njFkOcN5EkIL06+dQEMBvKIUprKOSbabztR0KNbjnBtuqdy68nuHqvmeQhzA9C6e4\nvwqHYr9EpBBU7JGyJ/5CHIGJRrR6ZEhf/FxK+BM6/LNPORw2J/I5m+cWn/sqEqKD\nQ0JugAqWmQKBgGOeyY+bfYq5PCCyDTNIETg6Ip5JnofH2vnBW+K4J8S9RhZ1PjFb\n8/u7MVyE+JSPG2yCMoSgWPpbKUWyDlb81v7OOOmTXXpN9X+h2SXlFWwAl+QWgyOe\npkKa0esQEJ0Tg0V4/UnxFHHfr+KW+UQtZ3i2BWw0kkn00CYWF+3Tl1spAoGBAMjD\n3+EIuYh8g2qB4L3CJ5w5siYz0wicx/jfbky6n6TbubqOb6Qnr5NdtbaL/zuogOs/\nANfRVk7qNpc2pfD7W5x1rsG0l3i7AlHgZDBf4dfV57pEJ1/t0j3a7nwgv0vGFNpU\nCYiNJTKZ55q0DVJJgTAZVXYzrl///jijsMlcv4yJAoGBAOpcm/6/1uPbJwOyMA7s\nSZeoD/oAtiSn7B8u3BUfQK5bbnCpTFgqHslALelK61P6+BPy7Rn74GZxMKy51ubv\ni1LO7RfTypb/Q2Mk6AYtfBQK5jejA+TquGOdAXw8kcjQz1uaCov8PMdsNvTCMeaZ\nTy2tPXX41zbj3i2Hmd6k061C\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
        clientEmail: "firebase-adminsdk-euzms@payru-30bfe.iam.gserviceaccount.com",
      })
    });
    console.log("Firebase initialised")
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
  }
}

export function generateJWT(user: any, phoneNumner: any) {
  const secretKey = JWT_SECRET || '1234';
  return jwt.sign(
    {
      userId: user,
      // phoneNumber: phoneNumner
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
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent message to ${response.successCount} tokens`);
      console.log(`Failed to send message to ${response.failureCount} tokens`);

      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          console.log(`Message successfully sent to token ${tokens[idx]}`);
        } else {
          console.error(
            `Failed to send message to token ${tokens[idx]}:`,
            resp.error?.message
          );
        }
      });
    } catch (error:any) {
      console.error("Error sending message:", error.message);
    }
  } else {
    console.log("No tokens available to send the notification.");
  }
};

export const sendOtpToMobile = async (phoneNumber:any,otp:string|Number) => {
  try {
    const url = `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/${phoneNumber}/${otp}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOtpBySessionId = async (sessionId:string, otp:string|Number) => {
  try {
    const url = `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;
    const response = await axios.get(url);
    // console.log('OTP Verified:', response.data);
    return response.data;
  } catch (error:any) {
    // console.error('Error verifying OTP:', error?.response?.data);
    return error?.response?.data;
  }
};