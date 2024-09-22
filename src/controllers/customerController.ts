import { Types } from "mongoose";
import { constants, CREDIT_SCORE, roles, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Shop from "../models/Shop";
import Transaction from "../models/Transaction";
import Frauds from "../models/Fraud";
import Review from "../models/Review";
import Wallet from "../models/Wallet";

export const createNewCustomer = async (req: any, res: any) => {
    const { phoneNumber, role } = req.body;
    try {
        if (!phoneNumber)
            return buildErrorResponse(res, constants.errors.invalidPhone, 404);
    
        if (!role)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);

        const checkUserExists = await User.findOne({ phoneNumber: phoneNumber }) as User

        if (!checkUserExists)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        console.log(checkUserExists,'ss');
        
        if (checkUserExists?._id && req?.user?.userId == String(checkUserExists?._id)) {
            return buildErrorResponse(res, constants.errors.cannotAddSelf, 400); 
        }

        const roles = await Role.findOne({ role: role });
        if (!roles)
            return buildErrorResponse(res, constants.errors.roleNotFound, 404);

        const isCustomerExists = await Customer.findOne({
            venderId: req?.user?.userId,
            customerId: checkUserExists?._id
        });

        if (isCustomerExists)
            return buildErrorResponse(res, constants.errors.customerAlreadyAdded, 404);

        const customerData = {
            role: roles?._id,
            venderId: req?.user?.userId,
            customerId: checkUserExists?._id
        }

        const user = new Customer(customerData);
        await user.save();
        
        return buildResponse(res, constants.success.customerAdded, 200);
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const deleteCustomer=async(req:any,res:any)=>{
    const { customerId } = req.query;
    try {
        if (!Types.ObjectId.isValid(customerId)) {
            return buildErrorResponse(res, constants.errors.invalidCustomer, 400);
        }

        const result = await Customer.findById(customerId);

        if(!result)
            return buildErrorResponse(res, constants.errors.customerNotExists, 404);
        
        await result.deleteOne();
    
        return buildResponse(res, constants.success.deletedNotification, 200);

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getCustomersOfVender=async(req:any,res:any)=>{
    try {
        //add check for venders
        const {userId}=req.user;
        const {role}=req.query;

        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;
        let filters: { venderId: any; role?: any } = { venderId: userId };

        if(role){
            const roles = await Role.findOne({role:role});
            filters = {...filters,role:roles?._id}
        }

        const customers = await Customer.find(filters)
        .populate("customerId")
        .populate("role")
        .populate("venderId")
        // .skip(skip)
        // .limit(limit);

        const totalCustomers = await Customer.countDocuments(filters);
        const totalPages = Math.ceil(totalCustomers / limit);

        return buildObjectResponse(res, {
            customers,
            totalPages,
            currentPage: page,
            totalItems: totalCustomers
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getVenderOfCustomer=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        console.log(userId,"user")

        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;

        const skip = (page - 1) * limit;

        const venders = await Customer.find({customerId: userId})
        .populate("role")
        .populate({
            path: 'venderId',
            populate: {
                path: 'shopId',
            },
        })
        // .skip(skip)
        // .limit(limit);

        const totalVenders = await Customer.countDocuments({customerId: userId});
        const totalPages = Math.ceil(totalVenders / limit);

        return buildObjectResponse(res, {
            venders,
            totalPages,
            currentPage: page,
            totalItems: totalVenders
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getRandomShopsNearBy=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        console.log(userId,'ss');
        
        const venderRoleId=await Role.findOne({role:roles.Vender});

        if(!venderRoleId)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);

        const customerIdsAndVenderIds = await Customer.find({customerId:userId});

        const venderIds = customerIdsAndVenderIds.map(item => item.venderId);        

        const unconnectedVenders = await User.find({
            _id: { $nin: venderIds },
            activeStatus:true,
            isProfileDone:true,
            role: venderRoleId
        }).populate("shopId");

        console.log(unconnectedVenders,'sss');
        
    

        return buildObjectResponse(res, {
            unconnectedVenders
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getRandomShopsWithinRange = async (req: any, res:any) => {
    try {
        const { longitude, latitude } = req.body.coordinates;
        const { userId } = req.user;

        const venderRoleId = await Role.findOne({ role: roles.Vender });

        if (!venderRoleId)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);

        const customerIdsAndVenderIds = await Customer.find({ customerId: userId });
        const venderIds = customerIdsAndVenderIds.map(item => item.venderId);

        const nearbyShops = await Shop.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: 5000,
                },
            },
            user: { $nin: venderIds },
        }).populate('user');

        const unconnectedVendersWithin5Km = nearbyShops.map(shop => shop.user);

        return buildObjectResponse(res, {
            unconnectedVenders: unconnectedVendersWithin5Km,
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const getCustomerAndTransactionsByVenderId=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        
        const customerDataList = await Customer.find({ venderId: userId }).select('customerId');
        const customerIds = customerDataList.map((customer) => customer.customerId);

        const customers = [];

        for (const customerId of customerIds) {
            const transactions = await Transaction.find({
                customerId: customerId,
                venderId: userId,
                transactionStatus: TRANSACTION_STATUS.PENDING,
                transactionType: TRANSACTION_TYPE.PARENT,    
            })
            .populate({
                path: "childTransaction"
            })
            .sort({ transactionDate: -1 });

            if (transactions.length === 0) {
                continue;
            }

            const customer:any = {
                details: {},
                transactions: []
            };

            const customerData = await User.findById(customerId);
            if (!customerData) {
                continue;
            }

            customer.details = customerData;
            customer.transactions = transactions;

            customers.push(customer);
        }

        return buildObjectResponse(res, {
            customers: customers
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getUserDetailsComplete=async(req:any,res:any)=>{
    try {
        const {userId}=req.query;
        
        const customer:any={
            details:{},
            totaltransactions:0,
            creditScore:"",
            totalReview:0,
            totalPaidTransactionsBeforeDue:0,
            totalPaidTransactionsAfterDue:0,
            totalUnpaidTransactions:0,
            isFraudMarkedAlready:false,
            ratingsInPercentage:{}
        }
        
        //customer
        const customerData = await User.findById(userId)
        customer.details = customerData

        //frauds
        const fraud=await Frauds.findOne({fraudsterId:userId})
        if(fraud){
            customer.isFraudMarkedAlready = fraud?.isBlocked
        }

        //role
        const role = await Role.findById(customerData?.role);

        const filter= {customerId:userId}
        // const filter=role?.role == roles.Customer ? {customerId:userId} : {shopId:userId}

        //reviews
        const review = await Review.countDocuments(filter)
        customer.totalReview = review

        // rating percentage
        const reviewsList=await Review.find(filter);
        const ratingCounts: any = {1: 0,2: 0,3: 0,4: 0,5: 0};

        reviewsList.forEach((review: any) => {
            const rating = review.ratings;
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating]++;
            }
        });
        const totalReviews = reviewsList.length;
        const ratingPercentages: any = {1: 0,2: 0,3: 0,4: 0,5: 0};
        Object.keys(ratingCounts).forEach((rating) => {
            const count = ratingCounts[rating];
            ratingPercentages[rating] = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        });
        
        customer.ratingsInPercentage = ratingPercentages;

        //transaction total
        const totaltransactions = await Transaction.countDocuments({
            customerId: userId,
            transactionType:TRANSACTION_TYPE.PARENT
        });
        customer.totaltransactions = totaltransactions

        const totalUnpaidTransactions = await Transaction.countDocuments({
            customerId: userId,
            transactionStatus: { $eq: TRANSACTION_STATUS.PENDING } ,
            transactionType:TRANSACTION_TYPE.PARENT
        });
        customer.totalUnpaidTransactions = totalUnpaidTransactions

        //check credit score
        const walledData = await Wallet.findOne({userId})
        let creditScore=walledData?.credit;
        customer.creditScore = creditScore;

        // paid transactions before and after due date
        const transactions = await Transaction.find({
            customerId: userId,
            transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE } ,
            transactionType:TRANSACTION_TYPE.PARENT
        });

        let totalPaidTransactionsBeforeDue = 0;
        let totalPaidTransactionsAfterDue = 0;

        transactions.forEach((transaction:any) => {
            const { dueDate, amountPaidDates } = transaction;
            if (amountPaidDates.length > 0) {
                const paidBeforeDue = amountPaidDates.some((paidDate:any) => new Date(paidDate) <= new Date(dueDate));
                const paidAfterDue = amountPaidDates.some((paidDate:any) => new Date(paidDate) > new Date(dueDate));

                if (paidBeforeDue) totalPaidTransactionsBeforeDue++;
                if (paidAfterDue) totalPaidTransactionsAfterDue++;
            }
        });

        customer.totalPaidTransactionsBeforeDue = totalPaidTransactionsBeforeDue;
        customer.totalPaidTransactionsAfterDue = totalPaidTransactionsAfterDue;
        
        return buildObjectResponse(res, {
            customer:customer
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}