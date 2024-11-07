import express from 'express';
import { getWalletData } from '../controllers/walletController';
import { acceptRejectDueDateRequest, createNewTransaction, getTransactionDetailById, listCompletedTransactionOfVender, listCompleteTransactionsOfCustomers, listCompleteTransactionUsingVenderId, listCustomerPartTransactionsByVender, listTodayDueDateTransactionsOfVender, listTransaction, listTransactionsOfCustomers, listTransactionUsingVenderId, payAmountToVender, updateDueDateByCustomer, updateMultipleTransactionStatuses, updateTransactionStatus, verifyTransaction,  } from '../controllers/transactionController';
const transactionRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

transactionRoute.get("/api/transaction/get-vender-transaction",verifyToken,listTransaction);
transactionRoute.get("/api/transaction/get-customer-transaction",verifyToken,listTransactionsOfCustomers);
transactionRoute.get(`/api/transaction/get-transaction-by-venderId/:venderId`,verifyToken,listTransactionUsingVenderId);
transactionRoute.get(`/api/transaction/get-completed-transaction-of-vender`,verifyToken,listCompletedTransactionOfVender);
transactionRoute.get(`/api/transaction/get-completed-transaction-of-customer`,verifyToken,listCompleteTransactionsOfCustomers);
transactionRoute.get(`/api/transaction/get-completed-transaction-by-venderId/:venderId`,verifyToken,listCompleteTransactionUsingVenderId);
transactionRoute.get(`/api/transaction/get-dueDate-transaction-of-vender`,verifyToken,listTodayDueDateTransactionsOfVender);
transactionRoute.get(`/api/transaction/get-customer-past-transaction-by-vender/:customerId`,verifyToken,listCustomerPartTransactionsByVender);

transactionRoute.post(`/api/transaction/create-new-transaction`,verifyToken,createNewTransaction);
transactionRoute.put(`/api/transaction/verify-transaction`,verifyToken,verifyTransaction);
transactionRoute.post(`/api/transaction/pay-amount`,verifyToken,payAmountToVender);
transactionRoute.put(`/api/transaction/update-due-date-customer`,verifyToken,updateDueDateByCustomer);
transactionRoute.put(`/api/transaction/accept-reject-update-due-date-customer`,verifyToken,acceptRejectDueDateRequest);
transactionRoute.put(`/api/transaction/update-transaction-status/:transactionId`,verifyToken,updateTransactionStatus);
transactionRoute.put(`/api/transaction/update-multiple-transaction-status`,verifyToken,updateMultipleTransactionStatuses);
transactionRoute.get(`/api/transaction/get-transaction-by-id/:transactionId`,verifyToken,getTransactionDetailById)

export default transactionRoute;