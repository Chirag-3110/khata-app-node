import mongoose, { Types } from "mongoose";
import { constants, FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_TYPE, roles } from "../constants";
import Reminder from "../models/reminder";
import Transaction from "../models/Transaction";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Notification from "../models/Notification";
import moment from "moment";
import { sendNotification } from "../utils";

export const addNewReminder=async(req:any,res:any)=>{
    try {
        const {transactionId,reminderDate,reminderMedium}=req.body;
        
        if(!transactionId)
            return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

        if(!reminderDate)
            return buildErrorResponse(res, constants.errors.reminderDataReqired, 404);
        
        if(!reminderMedium)
            return buildErrorResponse(res, constants.errors.reminderTypeRequired, 404);

        const existingTransactionReminders = await Reminder.find({ transactionId: transactionId });

        if (existingTransactionReminders?.length > 0) {
            const lastReminder = existingTransactionReminders[existingTransactionReminders.length - 1];
            const createdAtTime = moment(lastReminder.createdAt);
            const currentTime = moment();

            const hoursDifference = currentTime.diff(createdAtTime, 'hours');

            if (hoursDifference < 24) {
                return buildErrorResponse(res, constants.errors.reminderAlreadyExists, 400);
            }
        }

        const findTransaction = await Transaction.findById(transactionId);
        if (!findTransaction)
            return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

        const findVender=await User.findById(findTransaction?.venderId)
        const findUser = await User.findById(findTransaction?.customerId);

        if (!findVender)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        if (!findUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        const reminderData = {
            customerId: findTransaction?.customerId,
            venderId: findTransaction?.venderId,
            reminderDate: reminderDate,
            reminderMedium: reminderMedium,
            transactionId: transactionId
        };

        const reminder = new Reminder(reminderData);
        await reminder.save();

        const notificationBody={
            title:"Reminder",
            description:`You have recieved a new reminder for your next payment`,
            notificationType:NOTIFICATION_TYPE.REMINDER,
            userId:findTransaction?.customerId
        }
        const notification=new Notification(notificationBody);
        await notification.save();

        let message=FIREBASE_NOTIFICATION_MESSAGES.reminder.message.replace('{{shopName}}', findVender?.name)
        let title = FIREBASE_NOTIFICATION_MESSAGES.reminder.type;

        const tokens: string[] = [];
        findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
        if(tokens?.length>0){
            await sendNotification("Reminder Alert",message,tokens,{type:title,transactionId:transactionId})
        }

        return buildResponse(res, constants.success.reminderAddedSuccess, 200);

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const addBulkReminders = async (req: any, res: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { transactions } = req.body;
        console.log(transactions,"tre");
        
        let reminderMedium = "Notification"
        let reminderDate=moment()

        if (!Array.isArray(transactions) || transactions.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return buildErrorResponse(res, constants.errors.transactionsArrayRequired, 404);
        }

        const notifiedUsers = new Set();

        for (const transactionId of transactions) {

            if (!transactionId) {
                await session.abortTransaction();
                session.endSession();
                return buildErrorResponse(res, constants.errors.transactionNotFound, 404);
            }

            const existingTransactionReminders = await Reminder.find({ transactionId: transactionId }).session(session);

            if (existingTransactionReminders?.length > 0) {
                const lastReminder = existingTransactionReminders[existingTransactionReminders.length - 1];
                const createdAtTime = moment(lastReminder.createdAt);

                const hoursDifference = reminderDate.diff(createdAtTime, 'hours');

                if (hoursDifference < 24) {
                    await session.abortTransaction();
                    session.endSession();
                    return buildErrorResponse(res, constants.errors.reminderAlreadyExists, 400);
                }
            }

            const findTransaction = await Transaction.findById(transactionId).session(session);
            console.log(findTransaction,"tran");
            
            if (!findTransaction) {
                await session.abortTransaction();
                session.endSession();
                return buildErrorResponse(res, constants.errors.transactionNotFound, 404);
            }

            const reminderData = {
                customerId: findTransaction?.customerId,
                venderId: findTransaction?.venderId,
                reminderDate: reminderDate,
                reminderMedium: reminderMedium,
                transactionId: transactionId
            };

            const reminder = new Reminder(reminderData);
            await reminder.save({ session });

            if (!notifiedUsers.has(findTransaction.customerId.toString())) {
                const notificationBody = {
                    title: "Reminder",
                    description: `You have received a new reminder for your next payment`,
                    notificationType: NOTIFICATION_TYPE.REMINDER,
                    userId: findTransaction.customerId
                };

                console.log({
                    title: "Reminder",
                    description: `You have received a new reminder for your next payment`,
                    notificationType: NOTIFICATION_TYPE.REMINDER,
                    userId: findTransaction.customerId
                },"Notificaio trigger");
                

                const notification = new Notification(notificationBody);
                await notification.save({ session });

                notifiedUsers.add(findTransaction.customerId.toString());
            }
        }

        await session.commitTransaction();
        session.endSession();
        return buildResponse(res, constants.success.bulkRemindersAddedSuccess, 200);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error, "error");
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

  


export const listRemindersByVenderId=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);

        if(!findUser)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const reminders = await Reminder.find({ venderId: userId })
        .populate("customerId")
        .populate("transactionId")
        .populate("venderId")
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Reminder.countDocuments({ venderId: userId });
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            reminders,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const listRemindersByCustomerId=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);

        if(!findUser)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const reminders = await Reminder.find({ customerId: userId })
        .populate("customerId")
        .populate("transactionId")
        .populate("venderId")
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Reminder.countDocuments({ customerId: userId });
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            reminders,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const listRemindersByTransactionId=async(req:any,res:any)=>{
    try {
        const {transactionId}=req.params;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findTransaction=await Transaction.findById(transactionId);

        if(!findTransaction)
            return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

        const reminders = await Reminder.find({ transactionId: transactionId })
        .populate("customerId")
        .populate("transactionId")
        .populate("venderId")
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Reminder.countDocuments({ transactionId: transactionId });
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            reminders,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}
