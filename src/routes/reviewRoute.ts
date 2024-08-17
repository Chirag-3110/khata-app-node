import express from 'express';
import { addNewReview, listReviewsByCustomerId, listReviewsByVenderId } from '../controllers/reviewController';
const reviewRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

reviewRoute.post("/api/review/add-new-review",verifyToken,addNewReview);
reviewRoute.get("/api/review/get-reviews-by-venderId",verifyToken,listReviewsByVenderId);
reviewRoute.get("/api/review/get-reviews-by-customerId/:userId",verifyToken,listReviewsByCustomerId);

export default reviewRoute;