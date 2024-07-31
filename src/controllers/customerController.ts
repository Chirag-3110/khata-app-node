import { Types } from "mongoose";
import { constants, roles } from "../constants";
import Role from "../models/Role";
import Customer from "../models/customer";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";

export const createNewCustomer=async(req:any,res:any)=>{
    const { phoneNumber,role } = req.body;
    try {
        if(!phoneNumber)
            return buildErrorResponse(res, constants.errors.invalidPhone, 404);
        
        if(!role)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);
        
        if(!role)
            return buildErrorResponse(res, constants.errors.roleRequired, 404);
        
        const checkUserExists=await User.findOne({phoneNumber:phoneNumber});

        if(!checkUserExists)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        const roles = await Role.findOne({role:role});

        if(!roles)
            return buildErrorResponse(res, constants.errors.roleNotFound, 404);

        const isCustomerExists=await Customer.findOne({
            venderId:req?.user?.userId,
            customerId:checkUserExists?._id
        });

        if(isCustomerExists)
            return buildErrorResponse(res, constants.errors.customerAlreadyAdded, 404);

        const customerData={
            role:roles?._id,
            venderId:req?.user?.userId,
            customerId:checkUserExists?._id
        }

        const user=new Customer(customerData);

        await user.save();
        
        return buildResponse(res,constants.success.customerAdded,200);
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