import mongoose,{ Types } from "mongoose";
import { constants, FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_TYPE, } from "../constants";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import * as yup from 'yup';
import { fraudValidationSchema } from "../validations/fraudValidation";
import Frauds from "../models/Fraud";
import Customer from "../models/customer";
import User from "../models/user";
import Notification from "../models/Notification";
import { sendNotification } from "../utils";

export const addFraudEntry = async (req: any, res: any) => {
  const session = await mongoose.startSession(); 
  session.startTransaction(); 

  try {
    await fraudValidationSchema.validate(req.body, { abortEarly: false });

    const { fraudsterId, fraudAddedByUserId, transaction } = req.body;

    if (!mongoose.isValidObjectId(transaction)) {
      await session.abortTransaction();
      return buildErrorResponse(res, constants.errors.invalidTransactionId, 400);
    }

    if (!mongoose.isValidObjectId(fraudAddedByUserId)) {
      await session.abortTransaction(); 
      return buildErrorResponse(res, constants.errors.fraudAddUser, 400);
    }

    if (!mongoose.isValidObjectId(fraudsterId)) {
      await session.abortTransaction(); 
      return buildErrorResponse(res, constants.errors.fraudsterInvlidId, 400);
    }

    const findNewUser = await User.findById(fraudsterId).session(session);
    const findFraudAddedVedner = await User.findById(fraudAddedByUserId).session(session);

    if (!findFraudAddedVedner) {
      await session.abortTransaction(); 
      return buildErrorResponse(res, constants.errors.userNotFound, 400);
    }

    const tokens: string[] = [];
    findNewUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));

    const isFraudsterExists = await Frauds.findOne({ fraudsterId }).session(session);
    console.log(isFraudsterExists, "exists");

    if (!isFraudsterExists) {
      const fraudData = {
        fraudsterId: fraudsterId,
        fraudAddedByUserId: [fraudAddedByUserId],
        transactionIds: [transaction],
      };
      console.log(fraudData, "create fraud data");

      const fraud = new Frauds(fraudData);
      await fraud.save({ session });

      const notificationBody = {
        title: "Fraud Declared",
        description: `${findFraudAddedVedner?.name} is marked you as a fraud`,
        notificationType: NOTIFICATION_TYPE.FRAUD,
        userId: fraudsterId,
      };
      const notification = new Notification(notificationBody);
      await notification.save({ session });

      let message = FIREBASE_NOTIFICATION_MESSAGES.fraud_add.message.replace('{{userName}}',findFraudAddedVedner?.name);
      let title = FIREBASE_NOTIFICATION_MESSAGES.fraud_add.type;
      await sendNotification("Fraud Declared", message, tokens, { type: title });

      await session.commitTransaction(); 
      return buildResponse(res, constants.success.fraudNotExeedsLimit, 200);
    } else {
      if (isFraudsterExists?.fraudsCount?.valueOf() < 3) {
        let updateData: any = {};

        const existingUser = isFraudsterExists.fraudAddedByUserId.includes(fraudAddedByUserId);
        const existingTransaction = isFraudsterExists.transactionIds.includes(transaction);

        if (existingUser) {
          if (existingTransaction) {
            await session.abortTransaction(); 
            return buildErrorResponse(res,constants.errors.fraudAlreadyExistsForTransaction,400);
          } else {
            updateData.$addToSet = { transactionIds: transaction };
            updateData.$inc = { fraudsCount: 1 };
          }
        } else {
          updateData.$addToSet = {
            fraudAddedByUserId: fraudAddedByUserId,
            transactionIds: transaction,
          };
          updateData.$inc = { fraudsCount: 1 };
        }

        await Frauds.findByIdAndUpdate(isFraudsterExists._id, updateData, {session});

        const notificationBody = {
          title: "Fraud Declared",
          description: `${findFraudAddedVedner?.name} is marked you as a fraud`,
          notificationType: NOTIFICATION_TYPE.FRAUD,
          userId: fraudsterId,
        };
        const notification = new Notification(notificationBody);
        await notification.save({ session });

        let message = FIREBASE_NOTIFICATION_MESSAGES.fraud_add.message.replace(
          '{{userName}}',
          findFraudAddedVedner?.name
        );
        let title = FIREBASE_NOTIFICATION_MESSAGES.fraud_add.type;
        await sendNotification("Fraud Declared", message, tokens, { type: title });

        await session.commitTransaction(); 
        return buildResponse(res, constants.success.fraudNotExeedsLimit, 200);
      } else {
        let updateData: any = {};

        const existingUser = isFraudsterExists.fraudAddedByUserId.includes(fraudAddedByUserId);
        const existingTransaction = isFraudsterExists.transactionIds.includes(transaction);

        if (existingUser) {
          if (existingTransaction) {
            await session.abortTransaction(); 
            return buildErrorResponse(res,constants.errors.fraudAlreadyExistsForTransaction,400);
          } else {
            updateData.$addToSet = { transactionIds: transaction };
            updateData.$inc = { fraudsCount: 1 };
          }
        } else {
          updateData.$addToSet = {
            fraudAddedByUserId: fraudAddedByUserId,
            transactionIds: transaction,
          };
          updateData.$inc = { fraudsCount: 1 };
        }

        const fraudDeclareDate = isFraudsterExists.fraudDeclareDate || [];
        const newFraudDeclareDate = new Date();
        updateData.$set = {
          fraudDeclareDate: [...fraudDeclareDate, newFraudDeclareDate],
        };

        await Frauds.findByIdAndUpdate(isFraudsterExists._id, updateData, {session,});

        await Customer.updateMany({ customerId: fraudsterId },{ $set: { activeStatus: false } },{ session });

        const notificationBody = {
          title: "Account is blocked for further transactions.",
          description: `${findFraudAddedVedner?.name} has blocked you for further transactions.`,
          notificationType: NOTIFICATION_TYPE.FRAUD,
          userId: fraudsterId,
        };
        const notification = new Notification(notificationBody);
        await notification.save({ session });

        let message = FIREBASE_NOTIFICATION_MESSAGES.fraud_blocked_customer.message.replace('{{userName}}',findFraudAddedVedner?.name);
        let title = FIREBASE_NOTIFICATION_MESSAGES.fraud_blocked_customer.type;
        await sendNotification("Account Blocked",message,tokens,{ type: title });

        const customerVendors = await Customer.find({ customerId: fraudsterId }).session(session);

        if (customerVendors.length > 0) {
          const vendorNotifications = [];
          const vendorTokens: string[] = [];

          for (const customer of customerVendors) {
            const vendorId = customer.venderId;
            const vendor = await User.findById(vendorId).session(session);
            if (!vendor) {
              console.log(`Vendor with ID ${vendorId} not found.`);
              continue;
            }

            const notificationBody = {
              title: "Customer Blocked",
              description: `${findNewUser?.name} is blocked for all transactions, please take actions accordingly.`,
              notificationType: NOTIFICATION_TYPE.FRAUD,
              userId: vendorId,
            };
            vendorNotifications.push(new Notification(notificationBody));

            if (vendor.deviceToken?.length > 0) {
              vendor.deviceToken.forEach((device: any) =>vendorTokens.push(device?.fcmToken));
            }
          }

          if (vendorNotifications.length > 0) {
            await Notification.insertMany(vendorNotifications, { session });
          }

          if (vendorTokens.length > 0) {
            const vendorMessage = FIREBASE_NOTIFICATION_MESSAGES.fraud_blocked_venders.message.replace('{{userName}}',findFraudAddedVedner?.name);
            const vendorTitle = FIREBASE_NOTIFICATION_MESSAGES.fraud_blocked_venders.type;
            await sendNotification("Customer Blocked",vendorMessage,vendorTokens,{ type: vendorTitle });
          }
        }

        await session.commitTransaction(); 
        return buildResponse(res, constants.success.fraudUserBlock, 200);
      }
    }
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof yup.ValidationError) {
      return buildErrorResponse(res, error.errors.join(", "), 400);
    }
    console.error("Error adding fraud entry:", error);
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  } finally {
    session.endSession(); 
  }
};

export const reactivateCustomers = async (req: any, res: any) => {
  try {
    const { venderId,fraudId } = req.body;

    if (!mongoose.isValidObjectId(fraudId)) {
        return buildErrorResponse(res, constants.errors.invalidFraudId, 400);
    }

    const findFraud=await Frauds.findById(fraudId);

    if(!findFraud){
        return buildErrorResponse(res, constants.errors.fraudNotFound, 400);
    }

    const query: any = { customerId: findFraud?.fraudsterId }; 
    
    if (venderId) {
      if (!mongoose.isValidObjectId(venderId)) {
        return buildErrorResponse(res, constants.errors.invalidUserId, 400);
      }
      query.venderId = venderId;
    }

    const updatedCustomers = await Customer.updateMany(
      query,
      { $set: { activeStatus: true } }
    );

    await Frauds.findByIdAndUpdate(
        fraudId,
        {
            fraudsCount: 0
        },
        { new: true }
    );

    console.log("Customers reactivated successfully");

    return buildResponse(res, constants.success.customersReactivated, 200);

  } catch (error) {
    console.error("Error reactivating customers:", error);
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const getAllFraudsters=async(req:any,res:any)=>{
  try {

      const page = parseInt(req.query.page as string) || 1; 
      const limit = parseInt(req.query.limit as string) || 10;

      const skip = (page - 1) * limit;

      const fraudsters = await Frauds.find()
      .populate("fraudAddedByUserId")
      .populate("transactionIds")
      // .skip(skip)
      // .limit(limit);

      const totalVenders = await Frauds.countDocuments();
      const totalPages = Math.ceil(totalVenders / limit);

      return buildObjectResponse(res, {
        fraudsters,
          // totalPages,
          // currentPage: page,
          totalItems: totalVenders
      });

  } catch (error) {
      console.log(error, 'error');
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
}
