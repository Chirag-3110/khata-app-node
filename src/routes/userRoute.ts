import express from 'express';
import { checkUserVerify, completeRegistration, editProfile, editShopDetails, getShopById, getUserProfile, listCategoryForUser, sendOtp, logoutUser, registerDevice, updatedShopStatus, updateUserStatus, verifyUserByOtp,  } from '../controllers/userController';
const userRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

userRoute.post("/api/user/send-otp",sendOtp);
userRoute.post("/api/user/verify-otp",verifyUserByOtp);
userRoute.post("/api/user/complete-registration",completeRegistration);
userRoute.get("/api/user/check-user-profile",checkUserVerify);
userRoute.get(`/api/user/get-user-profile`,verifyToken,getUserProfile);
userRoute.get(`/api/user/get-shop/:shopId`,verifyToken,getShopById);
userRoute.put(`/api/user/update-shop-status`,verifyToken,updatedShopStatus);
userRoute.put(`/api/user/update-user-status/:userId`,verifyToken,updateUserStatus);
userRoute.put(`/api/user/update-user-detail`,verifyToken,editProfile);
userRoute.put(`/api/user/update-shop-detail`,verifyToken,editShopDetails);
userRoute.put(`/api/user/register-device`,registerDevice);
userRoute.put(`/api/user/log-out`,verifyToken,logoutUser);
userRoute.get(`/api/user/get-category`,listCategoryForUser);

export default userRoute;