import { constants, FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_TYPE, roles } from "../constants";
import Customer from "../models/customer";
import Notification from "../models/Notification";
import Review from "../models/Review";
import Role from "../models/Role";
import User from "../models/user";
import { sendNotification } from "../utils";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import { userValidationSchema } from "../validations/userValidation";

export const addNewReview=async(req:any,res:any)=>{
    try {
        const {customerId,shopId,description,ratings}=req.body;

        if(!customerId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);
        
        if(!shopId)
            return buildErrorResponse(res, constants.errors.shopIdInvalid, 404);

        if(!description)
            return buildErrorResponse(res, constants.errors.ratingDescription, 404);
        
        if(!ratings)
            return buildErrorResponse(res, constants.errors.ratingError, 404);

        const checkForReview=await Review.find({
            customerId: customerId,
            shopId: shopId
        });

        const shopUser=await User.findById(shopId);

        if (!shopUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        if(checkForReview?.length>0){
            return buildErrorResponse(res,constants.errors.reviewAlreadyExists,406);
        }

        const findUser = await User.findById(customerId);

        if (!findUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        const review=new Review(req.body);

        await review.save();

        const notificationBody={
            title:"New Review",
            description:`${shopUser?.name} has added their review`,
            notificationType:NOTIFICATION_TYPE.REVIEW,
            userId:customerId
        }
        const notification=new Notification(notificationBody);
        await notification.save();

        let message=FIREBASE_NOTIFICATION_MESSAGES.review.message.replace('{{shopUser}}', shopUser?.name);
        let title = FIREBASE_NOTIFICATION_MESSAGES.review.type;

        const tokens: string[] = [];
        findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
        if(tokens?.length>0){
            await sendNotification("New Review Recieved",message,tokens,{type:title})
        }
        
        return buildResponse(res,constants.success.reviewAddedSuccessfully,200);
    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const listReviewsByVenderId=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);

        if(!findUser)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const customers = await Review.find({ shopId: userId })
        .populate("customerId")
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Review.countDocuments({ shopId: userId });
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            customers,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const listReviewsByCustomerId=async(req:any,res:any)=>{
    try {
        const {userId}=req.params;

        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);

        if(!findUser)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const venders = await Review.find({ customerId: userId })
        .populate({
            path: "shopId",
            select: "email status activeStatus address name phoneNumber shopId",
            populate: {
                path: "shopId"
            }
        })
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Review.countDocuments({ customerId: userId });
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            venders,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error,"error")
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}