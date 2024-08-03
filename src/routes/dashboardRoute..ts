import express from 'express';
import { getVenderDashboardData } from '../controllers/dashboardController';
const dashboardRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

dashboardRoute.get("/api/dashobard/get-vender-dashboard-data",verifyToken,getVenderDashboardData);

export default dashboardRoute;