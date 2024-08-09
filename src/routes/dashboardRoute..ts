import express from 'express';
import { getCustomerDashboardData, getVenderDashboardData } from '../controllers/dashboardController';
const dashboardRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

dashboardRoute.get("/api/dashobard/get-vender-dashboard-data",verifyToken,getVenderDashboardData);
dashboardRoute.get("/api/dashobard/get-customer-dashboard-data",verifyToken,getCustomerDashboardData);

export default dashboardRoute;