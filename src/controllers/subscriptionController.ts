import express, { Request, Response } from 'express';
import { subscriptionUpdateValidationSchema, subscriptionValidationSchema } from '../validations/subscriptionValidation';
import Subscription from '../models/Subscription';
import { buildErrorResponse, buildObjectResponse, buildResponse } from '../utils/responseUtils';
import { constants, roles } from '../constants';
import User from '../models/user';
import Shop from '../models/Shop';

export const getAllSubs=async(req:any,res:any)=>{
    try {
        const subscription = await Subscription.find();
        return buildObjectResponse(res, {subscription});
    } catch (err) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const updateSubscriptionToUser=async(req:any,res:any)=>{
    try {
        const { purchaseDate, endDate, type, subscriptionId }=req.body;
        const {userId}=req.user;

        const validatedBody = await subscriptionUpdateValidationSchema.validate(req.body, {
            abortEarly: false, 
        });

        const findUser:any=await User.findById(userId).populate("role").populate("shopId");

        if (!findUser){
            return buildErrorResponse(res, constants.errors.userNotFound, 404);
        }   

        if(findUser?.role?.role == roles.Customer){
            return buildErrorResponse(res, constants.errors.userNotVender, 404);
        }

        let subscriptionData=await Subscription.findById(subscriptionId);

        if(!subscriptionData){
            return buildErrorResponse(res, constants.errors.subscrionNotFound, 404);
        }

        let shop = findUser?.shopId;

        const updatedShop = await Shop.findByIdAndUpdate(
            shop._id,
            {
                isSubscribed: true,
                subscriptionType: type,
                subPurchaseDate: purchaseDate,
                subExpireDate: endDate,
                subscriptionId: subscriptionData._id,
            },
            { new: true }
        );    
    
        if (!updatedShop) {
            return buildErrorResponse(res, constants.errors.shopUpdateFailed, 500);
        }

        console.log(updatedShop,'ss');
        

        return buildResponse(res, constants.success.subsAdded, 500);
    } catch (err:any) {
        if (err.name === 'ValidationError') {
            return buildErrorResponse(res, err.errors, 400);
        }
        console.log(err,"Err");
        
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const addNewSubscription=async(req:any,res:any)=>{
    
    try {
        const validatedBody = await subscriptionValidationSchema.validate(req.body, {
            abortEarly: false,
        });
        const newSubscription = new Subscription({
            userId: validatedBody.userId,
            name: validatedBody.name,
            validTill: validatedBody.validTill,
            description: validatedBody.description,
            price: validatedBody.price,
          });
        
        const savedSubscription = await newSubscription.save();

        return buildResponse(res, constants.success.subsAdded, 200);

    } catch (error:any) {
        if (error.name === 'ValidationError') {
            res.status(500).json({ message: error.errors });
        }else{
            return buildErrorResponse(res, constants.errors.internalServerError, 500);
        }
    }
}

