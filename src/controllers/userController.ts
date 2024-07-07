import { constants, roles } from "../constants";
import Role from "../models/Role";
import Shop from "../models/Shop";
import Wallet from "../models/Wallet";
import User from "../models/user";
import { generateJWT } from "../utils";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import { userValidationSchema } from "../validations/userValidation";

export const loginUser=async(req:any,res:any)=>{
    try {
        const {documentId}=req.body;
        if(!documentId)
            return buildErrorResponse(res, constants.errors.docIdNotgExists, 404);

        let userData=await User.findOne({documentId});
        
        let token=await generateJWT(userData?._id,documentId);

        return buildObjectResponse(res,{tokenData:token});
    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const createUser=async(req:any,res:any)=>{
    const { email,documentId } = req.body;
    try {
        if(!email)
            return buildErrorResponse(res, constants.errors.invalidEmail, 404);
        if(!documentId)
            return buildErrorResponse(res, constants.errors.docIdNotgExists, 404);

        let userData=await User.findOne({email});
        if(userData){
            return buildErrorResponse(res, constants.errors.emailAlreadyExist, 404);
        }

        await userValidationSchema.validate(req.body);
        
        const user= new User({email:email?.toLowerCase(),documentId})
        await user.save();
        console.log(req.body);
    
        return buildResponse(res,constants.success.registeredUserSuccessfully,200);
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const completeRegistration=async(req:any,res:any)=>{
    const { userData,shop,role } = req.body;
    const {email,name,address,dob,gender,qrCode,upiId,phoneNumber,businessCode}=userData
    try {
        let roleData=await Role.findOne({role});
        if(!roleData)
            return buildErrorResponse(res, constants.errors.roleNotFound, 401);
        
        let isUserExist=await User.findOne({email:email.toLowerCase()})
        
        if(!isUserExist)
            return buildErrorResponse(res, constants.errors.userNotFound, 401);

        let wallet=new Wallet({userId:isUserExist?._id});

        let wallerId=await wallet.save();

        let shopId=null;
        if(role === roles.Vender){
            const newShop=new Shop(shop);
            const shopDoc=await newShop.save();
            shopId=shopDoc?._id;
        }

        let updatedUserData={
            walletId:wallerId?._id,
            name:name,
            status:true,
            role:roleData?._id,
            shopId:shopId,
            activeStatus:true,
            isEmailVerified:true,
            address:address,
            dob:dob,
            gender:gender,
            qrCode:qrCode,
            upiId:upiId,
            isProfileDone:true,
            phoneNumber,
            businessCode
        }
        await User.findByIdAndUpdate(isUserExist?._id,updatedUserData)
        
        return buildResponse(res,constants.success.profileUpdated,200);
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const checkUserVerify=async (req:any,res:any) => {
    const { documentId } = req.query;

    try {
        if(!documentId)
            return buildErrorResponse(res, constants.errors.docIdNotgExists, 404);

        let userData=await User.findOne({documentId});
    
        return buildObjectResponse(res,{isProfileDone:userData?.isProfileDone});
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getUserProfile=async(req:any,res:any) => {
    const {documentId}=req.params;
    try {
        let userData = await User.findOne({ documentId })
            .populate('role')
            .populate('walletId');

        if (userData?.shopId) {
            userData = await User.findOne({ documentId })
                .populate('role')
                .populate('walletId')
                .populate('shopId');
        }

        // console.log(userData, "user");
        return buildObjectResponse(res,{user:userData});
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}