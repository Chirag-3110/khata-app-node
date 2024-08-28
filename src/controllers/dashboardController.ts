import { Types } from "mongoose";
import { constants, roles, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Transaction from "../models/Transaction";
import moment from "moment";
import Review from "../models/Review";
import Wallet from "../models/Wallet";
import Shop from "../models/Shop";

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
                paidAmount:0,
                bonusAmount:0
            }
        }
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);

        const findUser=await User.findById(userId);
        // console.log(findUser?.walletId,"ise")

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

        let bonusAmount:any=0;

        if(findUser?.walletId){
            const walletData=await Wallet.findById(findUser?.walletId);
            bonusAmount=walletData?.credit;
        }


        customerDashboardData={
            ...customerDashboardData,
            recentTransactions:recentTransactions,
            latestReviews:recentReview,
            amountDetails:{
                pendingAmount:pendingAmount,
                paidAmount:paidAmount,
                bonusAmount:bonusAmount
            }
        }

        return buildObjectResponse(res, {data:customerDashboardData});

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const dashboardSearch=async(req:any,res:any) => {
    const {userId}=req.user;
    const {searchQuery}=req.query

    try {
        if(!searchQuery || searchQuery==undefined){
            return buildObjectResponse(res, {data:[]});
        }
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);

        const findUser=await User.findById(userId);
        
        const role=await Role.findById(findUser?.role)

        const searchCustomer=await Role.findOne({role:roles.Customer});

        let results:any=[];

        if(role?.role == roles.Customer){
            const regexPattern = new RegExp(searchQuery, 'i');

            const shopsByName = await Shop.find({
                name: { $regex: regexPattern },
                canBeSearchable: true,
                status: true
            }).populate("user");

            console.log(shopsByName,"shop",searchQuery);
            

            const usersByPhone = await User.find({ phoneNumber: { $regex: regexPattern } }).select('_id');

            console.log(usersByPhone,"phone")

            const userIds = usersByPhone.map(user => user._id);

            const shopsByUserPhone = await Shop.find({
                user: { $in: userIds },
                canBeSearchable: true,
                status: true
            }).populate("user");
            results = [...shopsByName, ...shopsByUserPhone];
            results = results.filter((shop:any, index:any, self:any) =>
                index === self.findIndex((s:any) => (
                    s._id.toString() === shop._id.toString()
                ))
            );
        }else{
            const regexPattern = new RegExp(searchQuery, 'i'); 
            const users = await User.find({ name: { $regex: regexPattern},role: searchCustomer?._id }).select('_id');

            const userIds = users.map(user => user._id);
            results = await Customer.find({
                customerId: { $in: userIds },
                venderId: userId
            })
            .populate("customerId")
            .populate("venderId");   
        }

        return buildObjectResponse(res, {data:results});

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}
