
import {Types} from "mongoose";
import { FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_STATUS, constants } from "../constants";
import Notification from "../models/Notification";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import cron from 'node-cron';
import User from "../models/user";
import { sendNotification } from "../utils";

export const triggerNotification=async(req:any,res:any)=>{
    try {
        const {title,description,notificationType}=req.body;

        const notification=new Notification({title,description,notificationType,userId:req?.user?.userId});
        await notification.save();

        return buildResponse(res, constants.success.notificationSuccessfully, 200);
    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getUserNotification=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId: userId })
        .populate("userId")
        // .skip(skip)
        // .limit(limit);

        const totalNotifications = await Notification.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalNotifications / limit);

        return buildObjectResponse(res, {
            notifications,
            totalPages,
            currentPage: page,
            totalItems: totalNotifications
        });

    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getUnreadNotificaionOfUser=async(req:any,res:any)=>{
    try {
        const notification=await Notification.countDocuments({status:NOTIFICATION_STATUS.UNSEEN,userId:req?.user?.userId});
        return buildObjectResponse(res, {unreadNotification:notification});
    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const changeNotificationStatus=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        await Notification.updateMany(
            { userId: userId, status: NOTIFICATION_STATUS.UNSEEN },
            { $set: { status: NOTIFICATION_STATUS.SEEN } }
        );

        return buildResponse(res, constants.success.notificatinoStatusUpdatedSuccessfully,200);
    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const deleteNotification=async(req:any,res:any)=>{
    try {
        const { notificationId } = req.params;

        if (!Types.ObjectId.isValid(notificationId)) {
            return buildErrorResponse(res, constants.errors.invalidNotificationId, 400);
        }

        const result = await Notification.findById(notificationId);

        if(!result)
            return buildErrorResponse(res, constants.errors.notificationNotFound, 400);
        
        await result.deleteOne();
    
        return buildResponse(res, constants.success.deletedNotification, 200);
      

    } catch (error) {
        console.log(error,'error');
        
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const deleteAllNotification=async(req:any,res:any)=>{
    try {
        const { userId } = req.user;

        // console.log(userId);
        

        if (!Types.ObjectId.isValid(userId)) {
            return buildErrorResponse(res, constants.errors.invalidUserId, 400);
        }

        await Notification.deleteMany({ userId });

        return buildResponse(res, constants.success.deleteAllNoti, 200);
      

    } catch (error) {
        console.log(error,'error');
        
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const markNotificationSeenUnseen = async (req: any, res: any) => {
    try {
        const { notificationId, status } = req.body;

        if (!notificationId || ![NOTIFICATION_STATUS.SEEN, NOTIFICATION_STATUS.UNSEEN].includes(status)) {
            return buildErrorResponse(res, constants.errors.invalidRequest, 400);
        }

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return buildErrorResponse(res, constants.errors.notificationNotFound, 404);
        }

        return buildResponse(res, constants.success.notificatinoStatusUpdatedSuccessfully, 200);
        
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const notificationReminderCron = cron.schedule('0 */2 * * *', async () => {
// export const notificationReminderCron = cron.schedule('*/10 * * * * *', async () => {
    try {
        const users=await User.find({isProfileDone:false});

        const tokens: string[] = [];
        users.map((item)=>{
            item?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
        })

        let message=FIREBASE_NOTIFICATION_MESSAGES.user_onboard.message
        let title = FIREBASE_NOTIFICATION_MESSAGES.user_onboard.type;

        if(tokens?.length>0){
            await sendNotification("Payru profile pending?",message,tokens,{type:title})
        }

        console.log(tokens,"uisers")
    } catch (error) {
        console.log(error)
    }
});