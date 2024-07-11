import express from 'express';
import { createNewCustomer, deleteCustomer, getCustomersOfVender } from '../controllers/customerController';
const customerRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

customerRoute.post("/api/customer/add-new-customer",verifyToken,createNewCustomer);
customerRoute.delete("/api/customer/delete-customer",verifyToken,deleteCustomer);
customerRoute.get("/api/customer/get-customers-of-vender",verifyToken,getCustomersOfVender);

export default customerRoute;