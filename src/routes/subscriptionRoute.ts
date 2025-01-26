import express from 'express';
import { addNewSubscription, getAllSubs, updateSubscriptionToUser } from '../controllers/subscriptionController';
const subscriptionRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

subscriptionRoute.post("/api/subscription/add-new-subscription",verifyToken,addNewSubscription);
subscriptionRoute.get("/api/subscription/get-all-subscription",verifyToken,getAllSubs);
subscriptionRoute.put("/api/subscription/update-subscription-to-shop",verifyToken,updateSubscriptionToUser);

export default subscriptionRoute;