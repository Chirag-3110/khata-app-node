import { Types } from "mongoose";
import { TRANSACTION_STATUS, constants, roles } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Transaction from "../models/Transaction";
import Wallet from "../models/Wallet";

export const createNewTransaction=async(req:any,res:any)=>{
    const { customerId,amount,dueDate } = req.body;
    const {userId}=req.user;
    try {
        if(!customerId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);
        
        if(!amount)
            return buildErrorResponse(res, constants.errors.amountRequired, 404);

        const isCustomerExists=await Customer.findById(customerId);
    
        if(!isCustomerExists)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);

        const checkUserExists=await User.findById(userId);

        const transactionData={
            customerId:customerId,
            walletId:checkUserExists?.walletId,
            amount:amount,
            status:TRANSACTION_STATUS.PENDING,
            dueDate:dueDate
        }

        const transaction=new Transaction(transactionData);

        await transaction.save();

        const result = await Wallet.findById(checkUserExists?.walletId);
        const currentCredit = (result?.credit as number) ?? 0;

        await Wallet.findByIdAndUpdate(
            checkUserExists?.walletId,
            { credit: currentCredit + 2 },
            { new: true }
        );
        
        
        return buildResponse(res,constants.success.transactionDone,200);
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}