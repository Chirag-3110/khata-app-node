import express from 'express';
import { createNewCustomer, deleteCustomer, getCustomersOfVender, getRandomShopsNearBy, getVenderOfCustomer } from '../controllers/customerController';
const customerRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

customerRoute.post("/api/customer/add-new-customer",verifyToken,createNewCustomer);
customerRoute.delete("/api/customer/delete-customer",verifyToken,deleteCustomer);
customerRoute.get("/api/customer/get-customers-of-vender",verifyToken,getCustomersOfVender);
customerRoute.get("/api/customer/get-vender-of-customer",verifyToken,getVenderOfCustomer);
customerRoute.get("/api/customer/get-nearby-vender",verifyToken,getRandomShopsNearBy);

export default customerRoute;