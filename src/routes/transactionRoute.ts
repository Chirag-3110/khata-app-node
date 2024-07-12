import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getUserProfile, loginUser } from '../controllers/userController';
import { getWalletData } from '../controllers/walletController';
import { createNewTransaction } from '../controllers/transactionController';
const transactionRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

// transactionRoute.get("/api/user/check-user-profile",updateWalletData);
transactionRoute.post(`/api/transaction/create-new-transaction`,verifyToken,createNewTransaction);

export default transactionRoute;