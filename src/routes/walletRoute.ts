import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getUserProfile, loginUser } from '../controllers/userController';
import { getWalletData, getWalletTransactionList } from '../controllers/walletController';
const walletRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

// walletRoute.get("/api/user/check-user-profile",updateWalletData);
walletRoute.get(`/api/wallet/get-wallet-data`,verifyToken,getWalletData);
walletRoute.get(`/api/wallet/get-wallet-transaction-list`,verifyToken,getWalletTransactionList);

export default walletRoute;