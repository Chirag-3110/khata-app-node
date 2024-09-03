import { constants, FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_TYPE, roles } from "../constants";
import Customer from "../models/customer";
import Notification from "../models/Notification";
import Review from "../models/Review";
import Role from "../models/Role";
import User from "../models/user";
import { sendNotification } from "../utils";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import { userValidationSchema } from "../validations/userValidation";

export const redemCode=async(req:any,res:any)=>{
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