import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getUserProfile, loginUser } from '../controllers/userController';
import { getWalletData } from '../controllers/walletController';
const walletRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

// walletRoute.get("/api/user/check-user-profile",updateWalletData);
walletRoute.get(`/api/wallet/get-wallet-data`,verifyToken,getWalletData);

export default walletRoute;