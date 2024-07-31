import { constants, roles } from "../constants";
import Customer from "../models/customer";
import Review from "../models/Review";
import Role from "../models/Role";
import User from "../models/user";
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

        const review=new Review(req.body);

        await review.save();
        
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
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);

        if(!findUser)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const venders = await Review.find({ customerId: userId })
        .populate("shopId")
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