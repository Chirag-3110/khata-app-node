import express from 'express';
import { listAllCustomers, listAllVenders } from '../../controllers/admin/usersContoller';
const adminUserRoute = express.Router();

adminUserRoute.get("/api/admin/get-all-customer",listAllCustomers);
adminUserRoute.get("/api/admin/get-all-venders",listAllVenders);

export default adminUserRoute;