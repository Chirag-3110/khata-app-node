import mongoose,{ Types } from "mongoose";
import { constants, ENQUIRY_STATUS, NOTIFICATION_TYPE, roles, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../constants";
import Role from "../models/Role";
import User from "../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import { enquiryValidationSchema } from "../validations/enquiryValidation";
import * as yup from 'yup';
import { Category, Enquiry } from "../models/Enquiry";
import Notification from "../models/Notification";

export const createNewEnquiry=async(req:any,res:any) => {
    const {userId} = req.user;
    try {
        await enquiryValidationSchema.validate(req.body, { abortEarly: false });
        
        const { category, venderId, description } = req.body;

        if (!mongoose.isValidObjectId(category)) {
          return buildErrorResponse(res, 'Invalid Category ID', 400);
        }
    
        if (!mongoose.isValidObjectId(venderId)) {
          return buildErrorResponse(res, 'Invalid Vender ID', 400);
        }

        const findUser = await User.findById(venderId);
    
        if (!findUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        const enquiry = new Enquiry({
            category: category,
            userId: userId,
            venderId: venderId,
            description: description
        })

        await enquiry.save();

        const find = await User.findById(userId);

        const categoryName = await Category.findById(category);
console.log(categoryName,'sss',category);

        const notificationBody={
            title:"New Enquiry Raised",
            description:`${find?.name} has raised an enquiry related to ${categoryName?.name}`,
            notificationType:NOTIFICATION_TYPE.ENQUIRY,
            userId:venderId
        }
        const notification=new Notification(notificationBody);
        await notification.save();


        return buildResponse(res, constants.success.enquiryAdded ,200);

    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return buildErrorResponse(res, error.errors.join(', '), 400);
        } 
        console.error("Error updating shop details:", error);
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const listEnquiry = async (req: any, res: any) => {
    try {
      const { userId } = req.user;
  
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
  
      const skip = (page - 1) * limit;

      const findUser = await User.findById(userId);

      const findRole = await Role.findById(findUser?.role);
      console.log(findRole?.role,"role")

      let filter : any = {};

      if(findRole?.role == roles.Vender){
        filter = { venderId:userId }
      }else{
        filter = { userId:userId }
      }
  
      console.log(filter,'ss');
      
      const enquiry = await Enquiry.find(filter)
      .populate({
        path: findRole?.role == roles.Vender?"userId":"venderId"
      })
      .populate('feedbacks.userId')
      .populate('category')
      // .skip(skip)
      // .limit(limit);
  
      const totalenquiry = await Enquiry.countDocuments(filter);
      const totalPages = Math.ceil(totalenquiry / limit);
  
      return buildObjectResponse(res, {
        enquiry,
        // totalPages,
        // currentPage: page,
        // totalItems: totalenquiry,
      });
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};   

export const listCategoryForEnquiry = async (req: any, res: any) => {
    try {
      const category = await Category.find()
      return buildObjectResponse(res, {category});
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};  

export const reopenCloseEnquiry = async (req: any, res: any) => {
    try {
        const {enquiryId,description} = req.body;
        const { userId } = req.user;

        if(!enquiryId){
            return buildErrorResponse(res, constants.errors.enquiryIdNotValid, 400);
        }

        if (!mongoose.isValidObjectId(enquiryId)) {
            return buildErrorResponse(res, constants.errors.enquiryIdNotValid, 400);
        }

        const findEnq=await Enquiry.findById(enquiryId);
        if(!findEnq){
            return buildErrorResponse(res, constants.errors.enquiryNotFound, 400);
        }

        const findUser = await User.findById(userId);

        const findRole = await Role.findById(findUser?.role);
        console.log(findRole?.role,"role")

        await Enquiry.findByIdAndUpdate(
            enquiryId,
            {
                status: findRole?.role == roles.Vender ? ENQUIRY_STATUS.CLOSE : ENQUIRY_STATUS.OPEN,
                $push: { feedbacks: {
                    comment:description,
                    userId:userId
                } },
            },
            { new: true }
        )

        const notificationBody={
            title:findRole?.role == roles.Vender?"Enquiry Closed":"Enquiry Reopened",
            description:findRole?.role == roles.Vender?`${findUser?.name} has closed the enquiry.`:`${findUser?.name} has reopened the enquiry.`,
            notificationType:NOTIFICATION_TYPE.ENQUIRY,
            userId:findRole?.role == roles.Vender?findEnq?.userId:findEnq?.venderId
        }
        const notification=new Notification(notificationBody);
        await notification.save();

        return buildResponse(res, findRole?.role == roles.Vender?constants.success.enquiryClosed:constants.success.enquiryReopen, 200);
    } catch (error) {
      console.log(error, "error");
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};  

export const listEnquiryUsingVenderId = async (req: any, res: any) => {
  try {
    const { userId } = req.user;
    const {venderId}=req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    
    const enquiry = await Enquiry.find({ userId:userId,venderId:venderId })
    .populate('feedbacks.userId')
    .populate('category')
    // .skip(skip)
    // .limit(limit);

    const totalenquiry = await Enquiry.countDocuments({ userId:userId,venderId:venderId });
    const totalPages = Math.ceil(totalenquiry / limit);

    return buildObjectResponse(res, {
      enquiry,
      // totalPages,
      // currentPage: page,
      // totalItems: totalenquiry,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
}; 