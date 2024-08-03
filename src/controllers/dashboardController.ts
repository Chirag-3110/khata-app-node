import { Types } from "mongoose";
import { constants, roles } from "../constants";
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

        venderDashboardData={
            ...venderDashboardData,
            recentTransactions:recentTransactions,
            connectedCustomers:connectedCustomers,
            connectedVenders:connectedVenders
        }

        return buildObjectResponse(res, {data:venderDashboardData});

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}