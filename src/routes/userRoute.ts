import express from 'express';
import { checkUserVerify, completeRegistration, createUser, getShopById, getUserProfile, loginUser } from '../controllers/userController';
const userRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

userRoute.post("/api/user/login",loginUser);
userRoute.post("/api/user/create-user",createUser);
userRoute.post("/api/user/complete-registration",completeRegistration);
userRoute.get("/api/user/check-user-profile",checkUserVerify);
userRoute.get(`/api/user/get-user-profile/:documentId`,getUserProfile);
userRoute.get(`/api/user/get-shop/:shopId`,verifyToken,getShopById);

export default userRoute;