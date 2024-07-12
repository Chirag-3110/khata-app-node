import { Types } from "mongoose";
import { constants, roles } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Wallet from "../models/Wallet";

export const getWalletData=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;

        console.log(userId,'s');
        
        if (!Types.ObjectId.isValid(userId)) {
            return buildErrorResponse(res, constants.errors.invalidUserId, 400);
        }

        const findUser=await User.findById(userId);

        const walletData=await Wallet.findById(findUser?.walletId);

        return buildObjectResponse(res, walletData);

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}