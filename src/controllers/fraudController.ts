import mongoose,{ Types } from "mongoose";
import { constants, } from "../constants";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";
import * as yup from 'yup';
import { fraudValidationSchema } from "../validations/fraudValidation";
import Frauds from "../models/Fraud";
import Customer from "../models/customer";

export const addFraudEntry = async (req: any, res: any) => {
    try {
      await fraudValidationSchema.validate(req.body, { abortEarly: false });
  
      const { fraudsterId, fraudAddedByUserId, transaction } = req.body;
      console.log(req.body, "body");
  
      if (!mongoose.isValidObjectId(transaction)) {
        return buildErrorResponse(res, constants.errors.invalidTransactionId, 400);
      }
  
      if (!mongoose.isValidObjectId(fraudAddedByUserId)) {
        return buildErrorResponse(res, constants.errors.fraudsterInvlidId, 400);
      }
  
      if (!mongoose.isValidObjectId(fraudsterId)) {
        return buildErrorResponse(res, constants.errors.fraudsterInvlidId, 400);
      }
  
      const isFraudsterExists = await Frauds.findOne({ fraudsterId });
      console.log(isFraudsterExists, "exists");
  
      if (!isFraudsterExists) {
        const fraudData = {
          fraudsterId: fraudsterId,
          fraudAddedByUserId: [fraudAddedByUserId],
          transactionIds: [transaction],
        };
        console.log(fraudData, "create fraud data");
        const fraud = new Frauds(fraudData);
        await fraud.save();
        return buildResponse(res, constants.success.fraudNotExeedsLimit, 200);
      } else {
        if (isFraudsterExists?.fraudsCount?.valueOf() < 3) {
            let updateData: any = {};
    
            const existingUser = isFraudsterExists.fraudAddedByUserId.includes(fraudAddedByUserId);
            const existingTransaction = isFraudsterExists.transactionIds.includes(transaction);
    
            if (existingUser) {
                if (existingTransaction) {
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
    
            await Frauds.findByIdAndUpdate(isFraudsterExists._id, updateData);
            console.log("Fraud entry updated successfully");
            return buildResponse(res,constants.success.fraudNotExeedsLimit,200);

        } else {
          let updateData: any = {};
    
          const existingUser = isFraudsterExists.fraudAddedByUserId.includes(fraudAddedByUserId);
          const existingTransaction = isFraudsterExists.transactionIds.includes(transaction);
  
          if (existingUser) {
                if (existingTransaction) {
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
                fraudDeclareDate: [...fraudDeclareDate, newFraudDeclareDate] 
            };

          await Frauds.findByIdAndUpdate(isFraudsterExists._id, updateData);
          await Customer.updateMany(
            { customerId: fraudsterId },
            { $set: { activeStatus: false } }
          );
          console.log("Block the user");
          return buildResponse(res,constants.success.fraudUserBlock,200);
        }
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return buildErrorResponse(res, error.errors.join(", "), 400);
      }
      console.error("Error adding fraud entry:", error);
      return buildErrorResponse(res,constants.errors.internalServerError,500);
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
