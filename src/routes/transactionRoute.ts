import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getUserProfile, loginUser } from '../controllers/userController';
import { getWalletData } from '../controllers/walletController';
import { createNewTransaction, listTransaction, listTransactionsOfCustomers, payAmountToVender, updateDueDateByCustomer } from '../controllers/transactionController';
const transactionRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

transactionRoute.get("/api/transaction/get-vender-transaction",verifyToken,listTransaction);
transactionRoute.get("/api/transaction/get-customer-transaction",verifyToken,listTransactionsOfCustomers);
transactionRoute.post(`/api/transaction/create-new-transaction`,verifyToken,createNewTransaction);
transactionRoute.post(`/api/transaction/pay-amount`,verifyToken,payAmountToVender);
transactionRoute.put(`/api/transaction/update-due-date-customer`,verifyToken,updateDueDateByCustomer);

export default transactionRoute;