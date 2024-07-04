import express from 'express';
import { addNewRoles, getRoles } from '../controllers/roleController';
const roleRoute = express.Router();
const verifyToken = require('../middleware/auth'); 

roleRoute.get("/api/role/getAllRole",getRoles);
roleRoute.post("/api/role/add-Role",addNewRoles);

export default roleRoute;