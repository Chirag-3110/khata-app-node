import express from 'express';
import { loginUser } from '../controllers/userController';
const userRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

userRoute.get("/api/user/login",loginUser);

export default userRoute;