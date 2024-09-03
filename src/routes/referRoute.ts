import express from 'express';
import { createNewCustomer, deleteCustomer, getCustomersOfVender, getRandomShopsNearBy, getVenderOfCustomer } from '../controllers/customerController';
import { redemCode } from '../controllers/referController';
const customerRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

customerRoute.post("/api/customer/add-new-customer",verifyToken,redemCode);

export default customerRoute;