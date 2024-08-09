import { Types } from "mongoose";
import { constants, roles, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Transaction from "../models/Transaction";
import moment from "moment";
import Review from "../models/Review";

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

        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();

        const recentTransactions=await Transaction.find({venderId:userId,transactionType:TRANSACTION_TYPE.PARENT,transactionDate: { $gte: startOfMonth, $lte: endOfMonth }})
        .populate("customerId")
        .populate({
            path: "childTransaction"
        })
        .sort({ transactionDate: -1 })
        .limit(3);

        const connectedCustomers=await Customer.countDocuments({venderId:userId});

        const connectedVenders=await Customer.countDocuments({customerId:userId});

        const transactionAsVenderCompleted = await Transaction.find({
            venderId: userId,
            transactionType: TRANSACTION_TYPE.PARENT,
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate({
            path: "childTransaction"
        })
        
        let completedAmount=0;

        transactionAsVenderCompleted?.map((trasaction:any)=>{
            if(trasaction.transactionStatus == TRANSACTION_STATUS.COMPLETE){
                completedAmount += parseInt(trasaction?.amount)
            }else{
                trasaction?.childTransaction?.map((childTransaction:any)=>{
                    if(childTransaction.transactionStatus == TRANSACTION_STATUS.COMPLETE)
                        completedAmount += parseInt(childTransaction?.amount)
                })
            }
        })

        let pendingAmount=0;

        transactionAsVenderCompleted?.map((trasaction:any)=>{
            if(trasaction.transactionStatus == TRANSACTION_STATUS.PENDING){
                pendingAmount += parseInt(trasaction?.amount)
                trasaction?.childTransaction?.map((childTransaction:any)=>{
                    if(childTransaction.transactionStatus == TRANSACTION_STATUS.COMPLETE)
                        pendingAmount -= parseInt(childTransaction?.amount)
                })
            }
        })

        const transactionAsCustomerComplete = await Transaction.find({
            customerId: userId,
            transactionType: TRANSACTION_TYPE.PARENT,
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate({
            path: "childTransaction"
        });

        let paidAmount=0;

        transactionAsCustomerComplete?.map((trasaction:any)=>{
            if(trasaction.transactionStatus == TRANSACTION_STATUS.COMPLETE){
                paidAmount += parseInt(trasaction?.amount)
            }else{
                trasaction?.childTransaction?.map((childTransaction:any)=>{
                    if(childTransaction.transactionStatus == TRANSACTION_STATUS.COMPLETE)
                        paidAmount += parseInt(childTransaction?.amount)
                })
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

export const getCustomerDashboardData=async(req:any,res:any) => {
    const {userId}=req.user;
    try {
        let customerDashboardData=<Object>{
            recentTransactions:[],
            latestReviews:[],
            amountDetails:{
                pendingAmount:0,
                paidAmount:0
            }
        }
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);

        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();

        const recentTransactions=await Transaction.find({customerId:userId,transactionType:TRANSACTION_TYPE.PARENT,transactionDate: { $gte: startOfMonth, $lte: endOfMonth }})
        .populate("venderId")
        .populate({
            path: "childTransaction"
        })
        .sort({ transactionDate: -1 })
        .limit(3);

        const recentReview=await Review.find({customerId:userId})
        .populate("shopId")
        .limit(3);

        const transactionAsCustomerComplete = await Transaction.find({
            customerId: userId,
            transactionType: TRANSACTION_TYPE.PARENT,
            transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate({
            path: "childTransaction"
        })

        let pendingAmount=0;

        transactionAsCustomerComplete?.map((trasaction:any)=>{
            if(trasaction.transactionStatus == TRANSACTION_STATUS.PENDING){
                pendingAmount += parseInt(trasaction?.amount)
                trasaction?.childTransaction?.map((childTransaction:any)=>{
                    if(childTransaction.transactionStatus == TRANSACTION_STATUS.COMPLETE)
                        pendingAmount -= parseInt(childTransaction?.amount)
                })
            }
        })

        let paidAmount=0;

        transactionAsCustomerComplete?.map((trasaction:any)=>{
            if(trasaction.transactionStatus == TRANSACTION_STATUS.COMPLETE){
                paidAmount += parseInt(trasaction?.amount)
            }else{
                trasaction?.childTransaction?.map((childTransaction:any)=>{
                    if(childTransaction.transactionStatus == TRANSACTION_STATUS.COMPLETE)
                        paidAmount += parseInt(childTransaction?.amount)
                })
            }
        })

        customerDashboardData={
            ...customerDashboardData,
            recentTransactions:recentTransactions,
            latestReviews:recentReview,
            amountDetails:{
                pendingAmount:pendingAmount,
                paidAmount:paidAmount
            }
        }

        return buildObjectResponse(res, {data:customerDashboardData});

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}