import express from 'express';
import { dashboardSearch, getCustomerDashboardData, getVenderDashboardData } from '../controllers/dashboardController';
const dashboardRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

dashboardRoute.get("/api/dashobard/get-vender-dashboard-data",verifyToken,getVenderDashboardData);
dashboardRoute.get("/api/dashobard/get-customer-dashboard-data",verifyToken,getCustomerDashboardData);
dashboardRoute.post("/api/dashobard/search",verifyToken,dashboardSearch);

export default dashboardRoute;