import { Types } from "mongoose";
import { constants, roles, TRANSACTION_STATUS } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Transaction from "../models/Transaction";

export const getVenderDashboardData=async(req:any,res:any) => {
    const {userId}=req.user;
    try {
        let venderDashboardData=<Object>{
            recentTransactions:[],
            connectedCustomers:0,
            connectedVenders:0,
            amountDetails:{
                pendingAmount:0,
                collectedAmount:0,
                paidAmount:0
            }
        }
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);

        const recentTransactions=await Transaction.find({venderId:userId}).populate("customerId").sort({ transactionDate:-1 }).limit(3);

        const connectedCustomers=await Customer.countDocuments({venderId:userId});

        const connectedVenders=await Customer.countDocuments({customerId:userId});

        const transactionAsVenderCompeletd=await Transaction.find({venderId:userId,transactionStatus:TRANSACTION_STATUS.COMPLETE});

        let completedAmount=0;

        transactionAsVenderCompeletd?.map((trasaction:any)=>{
            if(trasaction?.childTransaction==0){
                completedAmount += parseInt(trasaction?.amount)
            }
        })

        const transactionAsVenderPending=await Transaction.find({venderId:userId,transactionStatus:{ $ne:TRANSACTION_STATUS.COMPLETE }});

        let pendingAmount=0;

        transactionAsVenderPending?.map((trasaction:any)=>{
            if(trasaction?.childTransaction==0){
                pendingAmount += parseInt(trasaction?.amount)
            }
        })

        const transactionAsCustomerComplete=await Transaction.find({customerId:userId,transactionStatus:TRANSACTION_STATUS.COMPLETE });

        let paidAmount=0;

        transactionAsCustomerComplete?.map((trasaction:any)=>{
            if(trasaction?.childTransaction==0){
                paidAmount += parseInt(trasaction?.amount)
            }
        })

        venderDashboardData={
            ...venderDashboardData,
            recentTransactions:recentTransactions,
            connectedCustomers:connectedCustomers,
            connectedVenders:connectedVenders,
            amountDetails:{
                pendingAmount:pendingAmount,
                collectedAmount:completedAmount,
                paidAmount:paidAmount
            }
        }

        return buildObjectResponse(res, {data:venderDashboardData});

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}