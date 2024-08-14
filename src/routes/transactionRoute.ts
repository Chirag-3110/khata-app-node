import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getUserProfile, loginUser } from '../controllers/userController';
import { getWalletData } from '../controllers/walletController';
import { acceptRejectDueDateRequest, createNewTransaction, getTransactionDetailById, listCompletedTransactionOfVender, listCompleteTransactionsOfCustomers, listCompleteTransactionUsingVenderId, listTransaction, listTransactionsOfCustomers, listTransactionUsingVenderId, payAmountToVender, updateDueDateByCustomer, updateTransactionStatus, verifyTransaction,  } from '../controllers/transactionController';
const transactionRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

transactionRoute.get("/api/transaction/get-vender-transaction",verifyToken,listTransaction);
transactionRoute.get("/api/transaction/get-customer-transaction",verifyToken,listTransactionsOfCustomers);
transactionRoute.get(`/api/transaction/get-transaction-by-venderId/:venderId`,verifyToken,listTransactionUsingVenderId);
transactionRoute.post(`/api/transaction/create-new-transaction`,verifyToken,createNewTransaction);
transactionRoute.put(`/api/transaction/verify-transaction`,verifyToken,verifyTransaction);
transactionRoute.post(`/api/transaction/pay-amount`,verifyToken,payAmountToVender);
transactionRoute.put(`/api/transaction/update-due-date-customer`,verifyToken,updateDueDateByCustomer);
transactionRoute.put(`/api/transaction/accept-reject-update-due-date-customer`,verifyToken,acceptRejectDueDateRequest);
transactionRoute.put(`/api/transaction/update-transaction-status/:transactionId`,verifyToken,updateTransactionStatus);
transactionRoute.get(`/api/transaction/get-transaction-by-id/:transactionId`,verifyToken,getTransactionDetailById);
transactionRoute.get(`/api/transaction/get-completed-transaction-of-vender`,verifyToken,listCompletedTransactionOfVender);
transactionRoute.get(`/api/transaction/get-completed-transaction-of-customer`,verifyToken,listCompleteTransactionsOfCustomers);
transactionRoute.get(`/api/transaction/get-completed-transaction-by-venderId/:venderId`,verifyToken,listCompleteTransactionUsingVenderId);

export default transactionRoute;