import express from 'express';
import { createNewEnquiry, listCategoryForEnquiry, listEnquiry, listEnquiryUsingVenderId, reopenCloseEnquiry } from '../controllers/enquiryController';
import { addFraudEntry, reactivateCustomers } from '../controllers/fraudController';
const fraudRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

fraudRoute.post("/api/fraud/add-new-fraud",verifyToken,addFraudEntry);
fraudRoute.put("/api/fraud/reactivate-customer",verifyToken,reactivateCustomers);

export default fraudRoute;