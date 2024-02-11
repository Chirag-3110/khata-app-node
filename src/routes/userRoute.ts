import express from 'express';
import { addNewUser, getUserProfile, loginUser } from '../controllers/userController';
const userRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

userRoute.post("/api/user/create",addNewUser);
userRoute.post("/api/user/login",loginUser);
userRoute.get("/api/user/get-profile",verifyToken,getUserProfile);

export default userRoute;