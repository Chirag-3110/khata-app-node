import express from 'express';
import { changeNotificationStatus, deleteNotification, getUnreadNotificaionOfUser, getUserNotification, triggerNotification } from '../controllers/notificationController';
const verifyToken = require('../middleware/auth')
const notificationRoute = express.Router();

notificationRoute.post("/api/notification/create-notification",verifyToken,triggerNotification);
notificationRoute.get("/api/notification/get-user-notification",verifyToken,getUserNotification);
notificationRoute.get("/api/notification/get-unread-notification",verifyToken,getUnreadNotificaionOfUser);
notificationRoute.put("/api/notification/change-notification-status",verifyToken,changeNotificationStatus);
notificationRoute.delete("/api/notification/delete-notification/:notificationId",verifyToken,deleteNotification);

export default notificationRoute;