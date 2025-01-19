    import { CATEGORY_TYPE, FIREBASE_NOTIFICATION_MESSAGES, META_DATA, TRANSACTION_MODULES, WALLET_TRANSACTION_TYPE, constants, roles } from "../constants";
import * as yup from 'yup';

import Role from "../models/Role";
import Shop from "../models/Shop";
import Wallet from "../models/Wallet";
import User from "../models/user";
import { generateJWT, generateOTP, generateReferralCode, sendNotification, sendOtpToMobile, verifyOtpBySessionId } from "../utils";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import { shopUpdateSchema, userValidationSchema } from "../validations/userValidation";
import cron from 'node-cron';
import RedemCode from "../models/RedemCode";
import WalletTransaction from "../models/walletTransaction";
import moment from "moment";
import { Category } from "../models/Enquiry";
import { MetaData } from "../models/MetaData";
import { close } from "fs";

export const sendOtp = async (req: any, res: any) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber)
            return buildErrorResponse(res, constants.errors.invalidPhone, 404);

        const findOtp=await MetaData.findOne({title:META_DATA.TRANS_OTP});
        const otp = findOtp?.description == "dev" ? "0000" :await generateOTP();

        const smsRes=await sendOtpToMobile(phoneNumber,otp);
        
        return buildObjectResponse(res, { sessionId: smsRes?.Details,otp:otp });

    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const verifyUserByOtp = async (req: any, res: any) => {
    try {
        const { sessionId, otp, phoneNumber } = req.body;
        console.log(sessionId, otp, phoneNumber);
        
        if (!otp)
            return buildErrorResponse(res, constants.errors.emptyOtp, 404);

        if (!sessionId)
            return buildErrorResponse(res, constants.errors.sessionIdReq, 404);

        if (!phoneNumber)
            return buildErrorResponse(res, constants.errors.invalidPhone, 404);
        
        const verificationResponse=await verifyOtpBySessionId(sessionId,otp);
        if(verificationResponse?.Status=="Error")
            return buildErrorResponse(res, verificationResponse?.Details, 406);
        
        let userData = await User.findOne({ phoneNumber:phoneNumber });
        
        if(userData){
            let token = await generateJWT(userData?._id, phoneNumber);
            return buildObjectResponse(res, { isProfileDone: userData?.isProfileDone, userId: userData?._id, token:token });
        }else{
            const user= new User({phoneNumber:phoneNumber?.trim()})
            const response = await user.save();
            let token = await generateJWT(response?._id, phoneNumber);
            return buildObjectResponse(res, { isProfileDone: response?.isProfileDone, userId: response?._id, token:token });
        }

    } catch (error) {
        console.log(error,"Error");
        
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const completeRegistration = async (req: any, res: any) => {
    const { userData, shop, role, redeemCode, pinCode, userId } = req.body;
    const { email, name, address, dob, gender, qrCode, upiId } = userData;

    const session = await User.startSession();
    session.startTransaction();

    try {
        if (!pinCode) {
            await session.abortTransaction();
            session.endSession();
            return buildErrorResponse(res, constants.errors.pinCodeRequired, 401);
        }

        let roleData = await Role.findOne({ role }).session(session);
        if (!roleData) {
            await session.abortTransaction();
            session.endSession();
            return buildErrorResponse(res, constants.errors.roleNotFound, 401);
        }

        let isUserExist = await User.findById(userId).session(session);
        
        if (!isUserExist) {
            await session.abortTransaction();
            session.endSession();
            return buildErrorResponse(res, constants.errors.userNotFound, 401);
        }

        if (redeemCode) {
            const findRedeemCode = await RedemCode.findOne({ redermCode: redeemCode }).session(session);
            if (!findRedeemCode) {
                await session.abortTransaction();
                session.endSession();
                return buildErrorResponse(res, constants.errors.redeemCodeError, 404);
            }

            let findRedemWallet = await Wallet.findOne({ userId: findRedeemCode.userId }).session(session);
            if (findRedemWallet) {
                const currentCredit = (findRedemWallet?.credit as number) ?? 0;
                await Wallet.findByIdAndUpdate(
                    findRedemWallet?._id,
                    { credit: currentCredit + 50 },
                    { new: true, session }
                );

                const walletData = {
                    walletAddress: findRedemWallet?._id,
                    amount: currentCredit + 50,
                    transactionType: WALLET_TRANSACTION_TYPE.DEPOSIT,
                    module: TRANSACTION_MODULES.REDEEM
                };
                const walletTransaction = new WalletTransaction(walletData);
                await walletTransaction.save({ session });
            }

            await RedemCode.findByIdAndUpdate(
                findRedeemCode?._id,
                { $push: { referedCodeUsers: isUserExist?._id } },
                { new: true, session }
            );
        }

        let shopId = null;
        if (role === roles.Vender) {
            if (!shop?.coordinates?.latitude || !shop?.coordinates?.longitude) {
                await session.abortTransaction();
                session.endSession();
                return buildErrorResponse(res, constants.errors.coordinatesRequired, 400);
            }

            const { latitude, longitude } = shop.coordinates;
            const newShop = new Shop({
                ...shop,
                user: isUserExist?._id,
                coordinates: { type: 'Point', coordinates: [longitude, latitude] }
            });
            const shopDoc = await newShop.save({ session });
            shopId = shopDoc?._id;
        }

        const referCodeValue = generateReferralCode();
        const redemCodeRef = new RedemCode({
            userId: isUserExist?._id,
            redermCode: `PR${referCodeValue}`
        });
        const generatedRedeemCodeId = await redemCodeRef.save({ session });

        let wallet = new Wallet({ userId: isUserExist?._id });
        let walletId = await wallet.save({ session });

        let updatedUserData = {
            walletId: walletId?._id,
            name: name,
            status: true,
            role: roleData?._id,
            shopId: shopId,
            activeStatus: true,
            isEmailVerified: true,
            address: address,
            dob: dob,
            gender: gender,
            qrCode: qrCode,
            upiId: upiId,
            isProfileDone: true,
            email,
            redeemCode: generatedRedeemCodeId?._id,
            pinCode: pinCode
        };
        await User.findByIdAndUpdate(isUserExist?._id, updatedUserData, { session });

        await session.commitTransaction();
        session.endSession();

        return buildResponse(res, constants.success.profileUpdated, 200);
    } catch (error) {
        console.log(error, 'error');
        await session.abortTransaction();
        session.endSession();
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};


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
    const {userId}=req.user;
    
    try {
        let userData = await User.findById(userId)
            .populate('role')
            .populate('walletId')
            .populate({
                path: 'redeemCode',
                populate: {
                    path: 'referedCodeUsers',
                    model: 'user',
                }
            });

        if (userData?.shopId) {
            userData = await User.findById(userId)
                .populate('role')
                .populate('walletId')
                .populate('shopId')
                .populate({
                    path: 'redeemCode',
                    populate: {
                        path: 'referedCodeUsers',
                        model: 'user',
                    }
                });
        }

        // console.log(userData, "user");
        return buildObjectResponse(res,{user:userData});
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const getShopById=async(req:any,res:any) => {
    const {shopId}=req.params;
    try {
        let shopData = await Shop.findById(shopId).populate("user")

        return buildObjectResponse(res,{shop:shopData});
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const updatedShopStatus=async(req:any,res:any) => {
    const {userId}=req.user;
    try {
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);
    
        const findUser = await User.findById(userId);
    
        if (!findUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        const checkForRole=await Role.findById(findUser?.role)

        if(checkForRole?.role === roles.Customer)
            return buildErrorResponse(res, constants.errors.userNotVender, 401);

        const userShop=await Shop.findById(findUser?.shopId)

        if(!userShop)
            return buildErrorResponse(res, constants.errors.shopNotFound, 401);

        // console.log(userShop,'Shop');

        await Shop.findByIdAndUpdate(
            userShop?._id,
            {
              status: !userShop?.status 
            },
            { new: true }
        )

        return buildResponse(res, constants.success.shopStatusChanged, 200);
    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const updateUserStatus=async(req:any,res:any) => {
    const {userId}=req.params;
    try {
        if (!userId)
            return buildErrorResponse(res, constants.errors.invalidUserId, 404);
    
        const findUser = await User.findById(userId);
    
        if (!findUser)
            return buildErrorResponse(res, constants.errors.userNotFound, 404);

        await User.findByIdAndUpdate(
            userId,
            {
                activeStatus: !findUser?.activeStatus 
            },
            { new: true }
        )

        const userShop=await Shop.findById(findUser?.shopId)

        if(userShop){
            await Shop.findByIdAndUpdate(
                userShop?._id,
                {
                  status: !userShop?.status 
                },
                { new: true }
            )
        }

        return buildResponse(res, findUser?.activeStatus?constants.success.userDeactivated:constants.success.userActivated, 200);

    } catch (error) {
        console.log(error, 'error');
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}

export const editProfile = async (req:any, res:any) => {
    const { userId, address, dob, gender, name, qrCode, upiId, email, pinCode } = req.body;
  
    try {
      if (!userId) {
        return buildErrorResponse(res, constants.errors.invalidUserId, 404);
      }
  
      const findUser = await User.findById(userId);
  
      if (!findUser) {
        return buildErrorResponse(res, constants.errors.userNotFound, 404);
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            address: address || findUser.address,
            dob: dob || findUser.dob,
            gender: gender || findUser.gender,
            name: name || findUser.name,
            qrCode: qrCode || findUser.qrCode,
            upiId: upiId || findUser.upiId,
            pinCode: pinCode || findUser?.pinCode,
            email: email || findUser?.email
        },
        { new: true }
      );
      console.log(updatedUser,"User");
      
      return buildResponse(res, constants.success.userProfileUpdate, 200);
  
    } catch (error) {
      console.error("Error updating user profile:", error);
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};  

export const editShopDetails = async (req: any, res: any) => {
    try {
        await shopUpdateSchema.validate(req.body, { abortEarly: false });
        const { shopId, name, location, ownerName, pan, gstNum, localListing, canBeSearchable, category, businessCode, openTime, closeDate } = req.body;
        const findShop = await Shop.findById(shopId);
  
        if (!findShop) {
            return buildErrorResponse(res, constants.errors.shopNotFound, 404);
        }
    
        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            {
            name: name || findShop.name,
            location: location || findShop.location,
            ownerName: ownerName || findShop.ownerName,
            pan: pan || findShop.pan,
            gstNum: gstNum || findShop.gstNum,
            localListing: localListing !== undefined ? localListing : findShop.localListing,
            canBeSearchable: canBeSearchable !== undefined ? canBeSearchable : findShop.canBeSearchable,
            category: category || findShop.category,
            businessCode: businessCode || findShop.businessCode,
            openTime: openTime ? new Date(openTime) : findShop.openTime,
            closeDate: closeDate ? new Date(closeDate) : findShop.closeDate,
            },
            { new: true }
        );
    
        return buildResponse(res, constants.success.shopProfileUpdate, 200);
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return buildErrorResponse(res, error.errors.join(', '), 400);
        } 
        console.error("Error updating shop details:", error);
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};
  

export const registerDevice = async (req: any, res: any) => {
    const { fcmToken, os, deviceId, userId } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return buildErrorResponse(res, constants.errors.userNotFound, 404);
      }
  
      const devices = user.deviceToken ?? [];
      const existingDevice = devices.find((device: any) => device.deviceId === deviceId);
  
      if (existingDevice) {
        existingDevice.fcmToken = fcmToken;
        existingDevice.os = os;
      } else {
        const newDevice: any = { deviceId, fcmToken, os };
        user.deviceToken.push(newDevice);
      }
      await user.save();
  
      return buildObjectResponse(res, { message: constants.success.tokenUpdated });
    } catch (error) {
        console.log(error,"error");
        
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const logoutUser = async (req: any, res: any) => {
    const { deviceId } = req.body;
    const {userId} = req.user;
  
    try {
      if (!deviceId) {
        return buildErrorResponse(res, constants.errors.deviceIdRequired, 404);
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return buildErrorResponse(res, constants.errors.userNotFound, 404);
      }
  
      const devices = user.deviceToken;
      const deviceIndex = devices.findIndex((device: any) => device.deviceId === deviceId);
  
      if (deviceIndex !== -1) {
        devices.splice(deviceIndex, 1);
        await user.save();
      }
  
      return buildObjectResponse(res, { message: constants.success.logoutSuccessfully });
    } catch (error) {
      console.log(error);
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const shopOnOffCron = cron.schedule('0 */2 * * *', async () => {
// export const shopOnOffCron = cron.schedule('*/30 * * * * *', async () => {
    console.log('Running a task every 30 seconds');

    try {
        const currentTime = moment()
        const shops = await Shop.find();
        for (const shop of shops) {
            const openTime = moment(shop.openTime).subtract(5, 'hours').subtract(30, 'minutes');
            const closeDate = moment(shop.closeDate).subtract(5, 'hours').subtract(30, 'minutes');
            const currentTimeTime = currentTime.format("HH:mm");
            const openTimeTime = openTime.format("HH:mm");
            const closeDateTime = closeDate.format("HH:mm");
            const isOpen = currentTimeTime >= openTimeTime && currentTimeTime < closeDateTime;
            let message;
            let title = FIREBASE_NOTIFICATION_MESSAGES.shopOpenClose.type;

            const shopOwner=await User.findById(shop.user)
            const tokens: string[] = [];
            shopOwner?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));

            if (isOpen) {
                if (!shop.status) {
                    // open the shop
                    shop.status = true;
                    message=FIREBASE_NOTIFICATION_MESSAGES.shopOpenClose.message.replace('{{shopName}}', shop.name).replace('{{status}}', "opened")
                    await sendNotification("Shop Reminder",message,tokens,{type:title})
                    await shop.save();
                    console.log(`Shop ${shop.name} is now open.`);
                }
            } else {
                if (shop.status) {
                    // close the shop
                    message=FIREBASE_NOTIFICATION_MESSAGES.shopOpenClose.message.replace('{{shopName}}', shop.name).replace('{{status}}', "closed")
                    await sendNotification("Shop Reminder",message,tokens,{type:title})
                    shop.status = false;
                    await shop.save();
                    console.log(`Shop ${shop.name} is now closed.`);
                }
            }
        }
    } catch (error) {
        console.error('Error updating shop status:', error);
    }
});

export const listCategoryForUser = async (req: any, res: any) => {
    try {
      const category = await Category.find({categoryType:CATEGORY_TYPE.REGISTER})
      return buildObjectResponse(res, {category});
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}; 