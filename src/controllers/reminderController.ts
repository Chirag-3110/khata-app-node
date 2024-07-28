import { constants, roles } from "../constants";
import Reminder from "../models/reminder";
import Transaction from "../models/Transaction";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";

export const addNewReminder=async(req:any,res:any)=>{
    try {
        const {transactionId,reminderDate,reminderMedium}=req.body;
        
        if(!transactionId)
            return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

        if(!reminderDate)
            return buildErrorResponse(res, constants.errors.reminderDataReqired, 404);
        
        if(!reminderMedium)
            return buildErrorResponse(res, constants.errors.reminderTypeRequired, 404);

        const findTransaction=await Transaction.findById(transactionId);
        if(!findTransaction)
            return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

        const reminderData={
            customerId: findTransaction?.customerId,
            venderId: findTransaction?.venderId,
            reminderDate:reminderDate,
            reminderMedium:reminderMedium,
            transactionId:transactionId
        }
        // console.log(reminderData,'tr')
        const reminder=new Reminder(reminderData);

        await reminder.save();
        
        return buildResponse(res,constants.success.reminderAddedSuccess,200);
    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

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
        .skip(skip)
        .limit(limit);

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
        .skip(skip)
        .limit(limit);

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
        .skip(skip)
        .limit(limit);

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
