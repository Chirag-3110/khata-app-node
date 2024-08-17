import { Types } from "mongoose";
import { constants, roles } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Wallet from "../models/Wallet";
import WalletTransaction from "../models/walletTransaction";

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

export const getWalletTransactionList=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const findUser=await User.findById(userId);
// console.log(findUser?.walletId);

        const transactions = await WalletTransaction.find({ walletAddress: findUser?.walletId })
        // .skip(skip)
        // .limit(limit);

        const totalTransactions = await WalletTransaction.countDocuments({ walletAddress: findUser?.walletId });
        const totalPages = Math.ceil(totalTransactions / limit);

        return buildObjectResponse(res, {
            transactions,
            // totalPages,
            // currentPage: page,
            // totalItems: totalTransactions
        });

    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}
