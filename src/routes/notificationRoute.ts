import express from 'express';
import { changeNotificationStatus, deleteAllNotification, deleteNotification, getUnreadNotificaionOfUser, getUserNotification, markNotificationSeenUnseen,testFcmNotificaion, testSms, triggerNotification } from '../controllers/notificationController';
const verifyToken = require('../middleware/auth')
const notificationRoute = express.Router();

notificationRoute.post("/api/notification/create-notification",verifyToken,triggerNotification);
notificationRoute.get("/api/notification/get-user-notification",verifyToken,getUserNotification);
notificationRoute.get("/api/notification/get-unread-notification",verifyToken,getUnreadNotificaionOfUser);
notificationRoute.put("/api/notification/change-notification-status",verifyToken,changeNotificationStatus);
notificationRoute.delete("/api/notification/delete-notification/:notificationId",verifyToken,deleteNotification);
notificationRoute.delete("/api/notification/delete-all-notification",verifyToken,deleteAllNotification);
notificationRoute.put("/api/notification/mark-seen-unseen-notification",verifyToken,markNotificationSeenUnseen);
notificationRoute.post("/api/notification/check-firebase-notification",testFcmNotificaion);
notificationRoute.post("/api/notification/check-sms-service",testSms);

export default notificationRoute;
