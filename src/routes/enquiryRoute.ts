import express from 'express';
import { createNewEnquiry, listCategoryForEnquiry, listEnquiry, reopenCloseEnquiry } from '../controllers/enquiryController';
const enquiryRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

enquiryRoute.post("/api/enquiry/add-new-enquiry",verifyToken,createNewEnquiry);
enquiryRoute.get("/api/enquiry/list-enquiry",verifyToken,listEnquiry);
enquiryRoute.get("/api/enquiry/list-enquiry-category",verifyToken,listCategoryForEnquiry);
enquiryRoute.put("/api/enquiry/give-feedback-enquiry",verifyToken,reopenCloseEnquiry);

export default enquiryRoute;