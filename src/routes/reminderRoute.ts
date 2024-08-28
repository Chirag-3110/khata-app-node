import express from 'express';
import { addBulkReminders, addNewReminder, listRemindersByCustomerId, listRemindersByTransactionId, listRemindersByVenderId } from '../controllers/reminderController';
const reminderRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

reminderRoute.post("/api/reminder/add-reminder",verifyToken,addNewReminder);
reminderRoute.post("/api/reminder/add-bulk-reminder",verifyToken,addBulkReminders);
reminderRoute.get("/api/reminder/get-reminders-of-vender",verifyToken,listRemindersByVenderId);
reminderRoute.get("/api/reminder/get-reminders-of-customers",verifyToken,listRemindersByCustomerId);
reminderRoute.get("/api/reminder/get-reminders-by-transaction-id/:transactionId",verifyToken,listRemindersByTransactionId);

export default reminderRoute;