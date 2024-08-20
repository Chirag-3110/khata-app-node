import express from 'express';
import { checkUserVerify, completeRegistration, createUser, editProfile, getShopById, getUserProfile, loginUser, logoutUser, registerDevice, updatedShopStatus, updateUserStatus,  } from '../controllers/userController';
const userRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

userRoute.post("/api/user/login",loginUser);
userRoute.post("/api/user/create-user",createUser);
userRoute.post("/api/user/complete-registration",completeRegistration);
userRoute.get("/api/user/check-user-profile",checkUserVerify);
userRoute.get(`/api/user/get-user-profile/:documentId`,getUserProfile);
userRoute.get(`/api/user/get-shop/:shopId`,verifyToken,getShopById);
userRoute.put(`/api/user/update-shop-status`,verifyToken,updatedShopStatus);
userRoute.put(`/api/user/update-user-status/:userId`,verifyToken,updateUserStatus);
userRoute.put(`/api/user/update-user-detail`,verifyToken,editProfile);
userRoute.put(`/api/user/register-device`,verifyToken,registerDevice);
userRoute.put(`/api/user/log-out`,verifyToken,logoutUser);

export default userRoute;