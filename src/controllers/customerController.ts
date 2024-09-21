import { Types } from "mongoose";
import { constants, roles, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import Shop from "../models/Shop";
import Transaction from "../models/Transaction";

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
        const venderRoleId=await Role.findOne({role:roles.Vender});

        if(!venderRoleId)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);

        const customerIdsAndVenderIds = await Customer.find({customerId:userId});

        const venderIds = customerIdsAndVenderIds.map(item => item.venderId);

        const unconnectedVenders = await User.find({
            _id: { $nin: venderIds },
            activeStatus:true,
            isProfileDone:true
        }).populate("shopId");
    

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

// working on it
export const getUserDetailsComplete=async(req:any,res:any)=>{
    try {
        const {userId}=req.query;
        const customer:any={
            details:{},
            TotalTransactions:0,
            creditScore:"",
            totalReview:0,
            totalPaidTransactionsBeforeDue:0,
            totalPaidTransactionsAfterDue:0,
            totalUnpaidTransactions:0,
            isFraudMarked:false
        }
        
        const customerData = await User.findById(userId)
        customer.details = customerData

        const roles = await Role.findById(customerData?.role);
        console.log(roles?.role,"sss");

        // const transactions = await Transaction.find({ 
        //     customerId: customerId,  
        //     venderId: userId,
        //     transactionStatus: { $eq: TRANSACTION_STATUS.PENDING } ,
        //     transactionType:TRANSACTION_TYPE.PARENT,
        // })
        // .populate({
        //     path: "childTransaction"
        // })
        // .sort({ transactionDate: -1 });
        
        // customer.transactions = transactions
        
        return buildObjectResponse(res, {
            customer:customer
        });

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}