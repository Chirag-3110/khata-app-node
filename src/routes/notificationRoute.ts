import express from 'express';
import { triggerNotification } from '../controllers/notificationController';
const notificationRoute = express.Router();

notificationRoute.get("/api/notification/create-notification",triggerNotification);

export default notificationRoute;