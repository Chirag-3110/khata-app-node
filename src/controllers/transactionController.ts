import mongoose, { Types } from "mongoose";
import { DUE_DATE_STATUS, FIREBASE_NOTIFICATION_MESSAGES, META_DATA, NOTIFICATION_TYPE, TRANSACTION_MODULES, TRANSACTION_STATUS, TRANSACTION_TYPE, WALLET_TRANSACTION_TYPE, constants, roles } from "../constants";
import User from "../models/user";
import {buildErrorResponse,buildObjectResponse,buildResponse,} from "../utils/responseUtils";
import Transaction from "../models/Transaction";
import Wallet from "../models/Wallet";
import { generateOTP, generateRandomTransactionRef, sendNotification } from "../utils";
import Notification from "../models/Notification";
import WalletTransaction from "../models/walletTransaction";
import Role from "../models/Role";
import Customer from "../models/customer";
import Frauds from "../models/Fraud";
import { MetaData } from "../models/MetaData";
import Otp from "../models/Otps";
import Shop from "../models/Shop";
import { log } from "console";
import { once } from "events";
const moment = require("moment");

export const createNewTransaction = async (req: any, res: any) => {
  const { userId, dueDate, venderId } = req.body;

  try {
    if (!userId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    if (!dueDate)
      return buildErrorResponse(res, constants.errors.invalidDueDate, 404);

    const findUser=await User.findOne({_id:userId,isProfileDone:true});
    const findVender=await User.findOne({_id:venderId,isProfileDone:true});
// console.log(findUser,'User');
// console.log(findVender,'Vendef');

    if(!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if(!findVender)
      return buildErrorResponse(res, constants.errors.userNotVender, 404);

    if(!findUser?.activeStatus){
      return buildErrorResponse(res, constants.errors.userDeactivated, 404);
    }

    if(!findVender?.activeStatus){
      return buildErrorResponse(res, constants.errors.userDeactivated, 404);
    }
    
    let shopName=findVender?.name
    if(findVender?.shopId){
      const shopData=await Shop.findById(findVender?.shopId)
      if(shopData)
        shopName = shopData?.name;
    }

    const isCustomerExits=await Customer.findOne({customerId:userId,venderId})

    const findOtp=await MetaData.findOne({title:META_DATA.TRANS_OTP});
    const otp = findOtp?.description == "dev" ? "0000" :await generateOTP();

    if(!isCustomerExits){
      const findFraud=await Frauds.findOne({fraudsterId:userId});
      if(findFraud && (findFraud?.isBlocked)){
        return buildErrorResponse(res, constants.errors.customerBlocked, 404);
      }
      
      const findNewUser=await User.findById(req?.user?.userId);
      const customerData = {
        role: findNewUser?.role,
        venderId: venderId,
        customerId: userId
      }

      const user = new Customer(customerData);
      let custReds=await user.save();

      const otpRes = new Otp({
        customerId:custReds?._id,
        otp: otp
      });
      await otpRes.save();

    }else{
      if(!isCustomerExits?.activeStatus){
        return buildErrorResponse(res, constants.errors.customerBlocked, 401);
      }else{
        const otpModal=await Otp.findOne({customerId:isCustomerExits?._id});
        if(!otpModal){
          return buildErrorResponse(res, constants.errors.unableToSendOtp, 404);
        }
        await Otp.findByIdAndUpdate(
          otpModal?._id,
          {
            otp: otp
          },
          { new: true }
        );
      }
    }

    // if(createdBy !== roles.Customer){
      const notificationBody={
        title:"Transaction initialization",
        description:`${otp} is your transaction otp. please share this otp with the vender for transaction creation`,
        notificationType:NOTIFICATION_TYPE.TRANSACTION,
        userId:userId
      }
      const notification=new Notification(notificationBody);
      await notification.save();
    // }

    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction.message.replace('{{userName}}', shopName).replace('{{otp}}', otp)
    let title = FIREBASE_NOTIFICATION_MESSAGES.transaction.type;

    const tokens: string[] = [];
    findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
    await sendNotification("Transaction Initialised",message,tokens,{type:title})

    return buildResponse(res, constants.success.otpSendSuccessfull,200);
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const verifyTransaction = async (req: any, res: any) => {
  const { transactionData, otp } = req.body;
  const {userId, amount, dueDate, venderId, description, createdBy, transactionUserToUser} = transactionData
  try {

    const findUser=await User.findById(venderId)
    const findCustomerUser=await User.findById(userId)

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);
    if (!findCustomerUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    const isCustomerExits=await Customer.findOne({customerId:userId,venderId})
    if(!isCustomerExits){
      return buildErrorResponse(res, constants.errors.customerNotExists, 404);
    }

    if(createdBy == roles.Vender){
      if (!otp)
        return buildErrorResponse(res, constants.errors.emptyOtp, 404);
  
      const otpModal=await Otp.findOne({customerId:isCustomerExits?._id});
  
      if(otpModal?.otp !== otp)
        return buildErrorResponse(res, constants.errors.invalidOtp, 404);
    }

    const transRef=generateRandomTransactionRef();

    let transactionData = {
      customerId: userId,
      venderId: venderId,
      amount: amount,
      dueDate: dueDate,
      status: TRANSACTION_STATUS.PENDING,
      transactionStatus: TRANSACTION_STATUS.PENDING,
      transactionType: TRANSACTION_TYPE.PARENT,
      dueDateStatus: DUE_DATE_STATUS.PENDING,
      description:description,
      otp:otp?otp:"0000",
      createdBy:createdBy?createdBy:roles.Vender,
      transactionRef:transRef,
      transactionDate: moment().format(),
      paymentType:"", 
      transactionUserToUser
    }

    const transaction = new Transaction(transactionData);

    const response = await transaction.save();

    const notificationBodies = [
      {
        title: "Transaction completed",
        description: `Your transaction is successfully created with the vendor`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: userId,
      },
      {
        title: "Transaction completed",
        description: `Your transaction is successfully created`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: venderId,
      },
    ];
    
    await Notification.insertMany(notificationBodies);
    // customer mg
    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_verify.message.replace('{{venderName}}', findUser?.name).replace('{{amount}}', amount);
    //vender msg
    let secondMessage=FIREBASE_NOTIFICATION_MESSAGES.transaction_verify.message.replace('{{customerName}}', findCustomerUser?.name).replace('{{amount}}', amount);
    let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_verify.type;

    const venderTokens: string[] = [];
    const customerTokens: string[] = [];
    findCustomerUser?.deviceToken?.map((device: any) => customerTokens.push(device?.fcmToken));
    findUser?.deviceToken?.map((device: any) => venderTokens.push(device?.fcmToken));

    if(customerTokens?.length>0){
      await sendNotification("Transaction Verified",message,customerTokens,{type:title,transactionId:response?._id})
    }

    if(venderTokens?.length>0){
      await sendNotification("Transaction Verified",secondMessage,venderTokens,{type:title,transactionId:response?._id})
    }

    // return buildResponse(res, constants.success.transactionSuccesfullStarted ,200);
    return buildObjectResponse(res, {transactonId:response?._id,transactionRef:transRef});
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const payAmountToVender = async (req: any, res: any) => {
  try {
    const { transactionId, amount, paymentType } = req.body;
    const { userId } = req.user;

    if (!transactionId)
      return buildErrorResponse(res,constants.errors.invalidTransactionId,404);

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    if (findTransaction.status === TRANSACTION_STATUS.COMPLETE)
      return buildErrorResponse(res,constants.errors.transactionIsCompleted,404);

    const findVender=await User.findById(findTransaction?.venderId)
    const findUser = await User.findById(findTransaction?.customerId);

    if (!findVender)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    const numberValue = parseFloat(findTransaction.amount.toString());

    let finalAmountAfterPartial = amount;

    const childTransactionIds = findTransaction.childTransaction || [];

    if (childTransactionIds.length > 0) {
      const childTransactions = await Transaction.find({
        _id: { $in: childTransactionIds },
      });
      const childTransactionAmount = childTransactions.reduce((sum, child) => sum + parseFloat(child.amount.toString()),0);
      finalAmountAfterPartial = numberValue - childTransactionAmount;
    }

    const date1Only = moment(findTransaction.dueDate).startOf("day");
    const date2Only = moment().startOf("day");

    const checkUserExists = await User.findById(userId);

    const result = await Wallet.findById(checkUserExists?.walletId);
    const currentCredit = (result?.credit as number) ?? 0;
    const currentDate = moment();

    if (date2Only.isSameOrBefore(date1Only)) {
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { 
            status: TRANSACTION_STATUS.CUSTOMER_PAID,
            paymentType: paymentType,
            $push: { amountPaidDates: currentDate },
          },
          { new: true }
        );
        console.log("Complete transaction directly");
      } else {
        if (finalAmountAfterPartial != amount) {
          return buildErrorResponse(res,constants.errors.cannotDoMorePartial,404);
        } else {
            const transactionData = {
                customerId: findTransaction.customerId,
                venderId: findTransaction.venderId,
                amount: amount,
                status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
                dueDate: findTransaction.dueDate,
                transactionStatus: TRANSACTION_STATUS.PENDING,
                transactionType:TRANSACTION_TYPE.CHILD,
                paymentType: paymentType
            };

            const transaction = new Transaction(transactionData);
            const childTransaction = await transaction.save();

            await Transaction.findByIdAndUpdate(
                transactionId,
                {
                  status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
                  paymentType: paymentType,
                  $push: { childTransaction: childTransaction._id, amountPaidDates: currentDate },
                },
                { new: true }
            );
            console.log("partial done");
        }
      }
    } else {
      console.log("date1 is after date2");
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { 
            status: TRANSACTION_STATUS.CUSTOMER_PAID,
            paymentType: paymentType,
            $push: { amountPaidDates: currentDate }, 
          },
          { new: true }
        );
        console.log("Complete transaction directly, but deduct credit");
      } else {
        if (finalAmountAfterPartial != amount) {
          return buildErrorResponse(
            res,
            constants.errors.cannotDoMorePartial,
            404
          );
        } else {
          const transactionData = {
            customerId: findTransaction.customerId,
            venderId: findTransaction.venderId,
            amount: amount,
            status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
            dueDate: findTransaction.dueDate,
            transactionStatus: TRANSACTION_STATUS.PENDING,
            transactionType:TRANSACTION_TYPE.CHILD,
            paymentType: paymentType,
          };

          const transaction = new Transaction(transactionData);
          const childTransaction = await transaction.save();

          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
              paymentType: paymentType,
              $push: { childTransaction: childTransaction._id, amountPaidDates: currentDate },
            },
            { new: true }
          );
          console.log("partial done");
        }
      }
    }

    let calculatedCreditScore=await calculateCreditScore(findTransaction?.customerId)

    await Wallet.findByIdAndUpdate(
      checkUserExists?.walletId,
      { credit: calculatedCreditScore.normalizedScore },
      { new: true }
    );
    const walletData={
      walletAddress: checkUserExists?.walletId,
      amount: calculatedCreditScore.normalizedScoreWithOutBase,
      transactionType:WALLET_TRANSACTION_TYPE.DEPOSIT,
      module:TRANSACTION_MODULES.TRANSACTION
    }
    const walletTransaction=new WalletTransaction(walletData);
    await walletTransaction.save();

    const notificationBodies = [
      {
        title: "Payment Done",
        description: `${amount} is paid to transaction with id ${findTransaction?.transactionRef}`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: findTransaction?.customerId,
      },
      {
        title: "Amount Recieved",
        description: `${amount} is recieved with transaction id ${findTransaction?.transactionRef}`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: findTransaction?.venderId,
      },
    ];
    
    await Notification.insertMany(notificationBodies);

    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_amount_pay.message.replace('{{amount}}', amount).replace('{{userName}}', findUser.name);
    let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_amount_pay.type;

    const tokens: string[] = [];
    findVender?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
    if(tokens?.length>0){
      await sendNotification("Transaction Amount Payment recieved",message,tokens,{type:title,transactionId:transactionId})
    }
    
    return buildResponse(res, constants.success.transactionDone, 200);

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const updateDueDateByCustomer = async (req: any, res: any) => {
  try {
    const { transactionId, dueDate } = req.body;

    if (!transactionId)
      return buildErrorResponse(res,constants.errors.invalidTransactionId,404);

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    if (findTransaction?.dueDateUpdatedCount == 1)
      return buildErrorResponse(res,constants.errors.transactionDueDateUpdate,406);

    const findVender=await User.findById(findTransaction?.venderId)
    const findUser = await User.findById(findTransaction?.customerId);

    if (!findVender)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    const dueDateUpdatedCount = (findTransaction.dueDateUpdatedCount? findTransaction.dueDateUpdatedCount.valueOf(): 0) + 1;

    await Transaction.findByIdAndUpdate(
      transactionId,
      {
        dueDateStatus: DUE_DATE_STATUS.REQUESTED,
        requestedDueDate: dueDate,
        dueDateUpdatedCount: dueDateUpdatedCount
      },
      { new: true }
    );

    const notificationBody={
      title:"Due date update request",
      description:`${findUser?.name} has raised a request for due date update`,
      notificationType:NOTIFICATION_TYPE.TRANSACTION,
      userId:findTransaction?.venderId
    }
    const notification=new Notification(notificationBody);
    await notification.save();

    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_request.message.replace('{{userName}}', findUser?.name).replace('{{amount}}', findTransaction.amount.toString());
    let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_request.type;

    const tokens: string[] = [];
    findVender?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
    if(tokens?.length>0){
      await sendNotification("Due date update request",message,tokens,{type:title})
    }

    return buildResponse(res, constants.success.dueDateRequested, 200);
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const acceptRejectDueDateRequest = async (req: any, res: any) => {
  try {
    const { transactionId, status } = req.body;

    if (!transactionId)
      return buildErrorResponse(res,constants.errors.invalidTransactionId,404);

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    const findUser = await User.findById(findTransaction?.customerId);

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if(status == DUE_DATE_STATUS.ACCEPT){
      await Transaction.findByIdAndUpdate(
        transactionId,
        { dueDate: findTransaction?.requestedDueDate, dueDateStatus: DUE_DATE_STATUS.ACCEPT },
        { new: true }
      );

      const notificationBody={
        title:"Due date update accepted",
        description:`Your request for due date update is accepted`,
        notificationType:NOTIFICATION_TYPE.TRANSACTION,
        userId:findTransaction?.customerId
      }
      const notification=new Notification(notificationBody);
      await notification.save();

      let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_request_response.message.replace('{{request}}', "accepted");
      let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_request_response.type;

      const tokens: string[] = [];
      findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
      if(tokens?.length>0){
        await sendNotification("Due date update request",message,tokens,{type:title})
      }
  
      return buildResponse(res, constants.success.transactionDueDateUpdate, 200);

    } else if (status == DUE_DATE_STATUS.REJECT){
      await Transaction.findByIdAndUpdate(
        transactionId,
        { dueDateStatus: DUE_DATE_STATUS.REJECT },
        { new: true }
      );

      const notificationBody={
        title:"Due date update rejected",
        description:`Your request for due date update is rejected`,
        notificationType:NOTIFICATION_TYPE.TRANSACTION,
        userId:transactionId?.customerId
      }
      const notification=new Notification(notificationBody);
      await notification.save();

      let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_request_response.message.replace('{{request}}', "rejected");
      let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_request_response.type;

      const tokens: string[] = [];
      findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
      if(tokens?.length>0){
        await sendNotification("Due date update request",message,tokens,{type:title})
      }

      return buildResponse(res, constants.success.transactionDueDateReject, 200);
    }
    else {
      return buildErrorResponse(res, constants.errors.unableToChange, 400);
    }

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const updateTransactionStatus = async (req: any, res: any) => {
  try {
    const { transactionId } = req.params;
    const {paymentType}=req.body

    if (!transactionId)
      return buildErrorResponse(
        res,
        constants.errors.invalidTransactionId,
        404
      );

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    const findVender=await User.findById(findTransaction?.venderId)
    const findUser = await User.findById(findTransaction?.customerId);

    if (!findVender)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if(findTransaction?.status == TRANSACTION_STATUS.PENDING)
      return buildErrorResponse(res, constants.errors.transactionIsInPendingState, 200);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (findTransaction.childTransaction.length === 0) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          {
            status: TRANSACTION_STATUS.COMPLETE,
            transactionStatus: TRANSACTION_STATUS.COMPLETE
          },
          { new: true, session }
        );
      } else {
        await Transaction.findByIdAndUpdate(
          transactionId,
          {
            status: TRANSACTION_STATUS.COMPLETE,
            transactionStatus: TRANSACTION_STATUS.COMPLETE
          },
          { new: true, session }
        );

        await Transaction.updateMany(
          { _id: { $in: findTransaction.childTransaction } },
          {
            transactionStatus: TRANSACTION_STATUS.COMPLETE,
            status: TRANSACTION_STATUS.COMPLETE
          },
          { session }
        );
      }

      let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_status_update.message.replace('{{venderName}}', findVender?.name).replace('{{amount}}', findTransaction.amount.toString());
      let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_status_update.type;

      const tokens: string[] = [];
      findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
      if(tokens?.length>0){
        await sendNotification("Transaction status updates",message,tokens,{type:title})
      }

      await session.commitTransaction();
      session.endSession();

      return buildResponse(
        res,
        constants.success.transactionStatusUpdated,
        200
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating transaction status:", error);
      return buildErrorResponse(
        res,
        constants.errors.errorUpdateTransaction,
        500
      );
    }
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const updateMultipleTransactionStatuses = async (req: any, res: any) => {
  try {
    const { transactionIds, paymentType } = req.body;
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return buildErrorResponse(res, constants.errors.invalidTransactionId, 404);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const transactionId of transactionIds) {
        const findTransaction = await Transaction.findById(transactionId).session(session);

        if (!findTransaction) {
          await session.abortTransaction();
          return buildErrorResponse(res, constants.errors.transactionNotFound, 404);
        }

        if(findTransaction?.status == TRANSACTION_STATUS.PENDING)
          return buildErrorResponse(res, constants.errors.transactionIsInPendingState, 404);

        const findVender = await User.findById(findTransaction?.venderId).session(session);
        const findUser = await User.findById(findTransaction?.customerId).session(session);

        if (!findVender || !findUser) {
          await session.abortTransaction();
          return buildErrorResponse(res, constants.errors.userNotFound, 404);
        }

        if (findTransaction.childTransaction.length === 0) {
          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: TRANSACTION_STATUS.COMPLETE,
              transactionStatus: TRANSACTION_STATUS.COMPLETE
            },
            { new: true, session }
          );
        } else {
          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: TRANSACTION_STATUS.COMPLETE,
              transactionStatus: TRANSACTION_STATUS.COMPLETE
            },
            { new: true, session }
          );

          await Transaction.updateMany(
            { _id: { $in: findTransaction.childTransaction } },
            {
              transactionStatus: TRANSACTION_STATUS.COMPLETE,
              status: TRANSACTION_STATUS.COMPLETE
            },
            { session }
          );
        }

        // let message = FIREBASE_NOTIFICATION_MESSAGES.transaction_status_update.message.replace('{{venderName}}', findVender?.name);
        // let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_status_update.type;

        // const tokens: string[] = [];
        // findUser?.deviceToken?.forEach((device: any) => tokens.push(device?.fcmToken));

        // if (tokens.length > 0) {
        //   await sendNotification("Transaction status updates", message, tokens, { type: title });
        // }
      }

      await session.commitTransaction();
      session.endSession();

      return buildResponse(res, constants.success.transactionStatusUpdated, 200);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating multiple transaction statuses:", error);
      return buildErrorResponse(res, constants.errors.errorUpdateTransaction, 500);
    }
  } catch (error) {
    console.log("Error in request:", error);
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};


export const getTransactionDetailById = async (req: any, res: any) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId)
      return buildErrorResponse(res, constants.errors.invalidTransactionId, 404);

    const transactions = await Transaction.findById(transactionId)
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
      .populate("customerId")
      .populate({
          path: "childTransaction",
          populate: {
            path: "venderId customerId",
          },
      });

    return buildObjectResponse(res, {transaction:transactions,});
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listTransaction = async (req: any, res: any) => {
  try {
    const { userId } = req.user;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { fromDate, toDate, sortField = 'transactionDate', sortBy = -1 } = req.query;

    let dateFilter: any = {};
    if (fromDate) {
      const correctedFromDate = moment(fromDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').toISOString();
      dateFilter.$gte = new Date(correctedFromDate);
    }
    if (toDate) {
      const correctedToDate = moment(toDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').add(1, 'day').toISOString();
      dateFilter.$lt = new Date(correctedToDate);
    }


    const transactions = await Transaction.find({
      // venderId: userId,
      $or: [
        { venderId: userId },
        { customerId: userId }
      ],
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType: TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
      .populate("customerId")
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
      .populate({
        path: "childTransaction"
      })
      .sort({ [sortField] : sortBy })
      // .skip(skip)
      // .limit(limit);

    // const totaltransactions = await Transaction.countDocuments({
    //   venderId: userId,
    //   transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
    //   transactionType: TRANSACTION_TYPE.PARENT,
    //   ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    // });

    // const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      // totalPages,
      // currentPage: page,
      // totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listTransactionsOfCustomers = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const { fromDate, toDate, sortField = 'transactionDate', sortBy = -1 } = req.query;

    let dateFilter: any = {};
    if (fromDate) {
      const correctedFromDate = moment(fromDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').toISOString();
      dateFilter.$gte = new Date(correctedFromDate);
    }
    if (toDate) {
      const correctedToDate = moment(toDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').add(1, 'day').toISOString();
      dateFilter.$lt = new Date(correctedToDate);
    }

    console.log(dateFilter, 'dateFilter');

    const transactions = await Transaction.find({ 
      customerId: userId, 
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE } ,
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
    .populate("customerId")
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
    .populate({
      path: "childTransaction"
    })
    // .sort({ transactionDate: -1 });
    .sort({ [sortField] : sortBy })
    // .skip(skip)
    // .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      customerId: userId,
      status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE } ,
      transactionType:TRANSACTION_TYPE.PARENT
    });
    const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      totalPages,
      currentPage: page,
      totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listTransactionUsingVenderId = async (req: any, res: any) => {
  try {
    const { userId } = req.user;
    const { venderId } = req.params;

    if (!venderId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const { fromDate, toDate, sortField = 'transactionDate', sortBy = -1  } = req.query;

    let dateFilter: any = {};
    if (fromDate) {
      const correctedFromDate = moment(fromDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').toISOString();
      dateFilter.$gte = new Date(correctedFromDate);
    }
    if (toDate) {
      const correctedToDate = moment(toDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').add(1, 'day').toISOString();
      dateFilter.$lt = new Date(correctedToDate);
    }


    const transactions = await Transaction.find({
      customerId: userId,
      venderId: venderId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
    .populate("customerId")
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ [sortField] : sortBy })
    // .skip(skip)
    // .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      customerId: userId,
      venderId: venderId,
      status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
    });
    const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      totalPages,
      currentPage: page,
      totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listCompleteTransactionsOfCustomers = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const { fromDate, toDate, sortField = 'transactionDate', sortBy = -1  } = req.query;

    let dateFilter: any = {};
    if (fromDate) {
      const correctedFromDate = moment(fromDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').toISOString();
      dateFilter.$gte = new Date(correctedFromDate);
    }
    if (toDate) {
      const correctedToDate = moment(toDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').add(1, 'day').toISOString();
      dateFilter.$lt = new Date(correctedToDate);
    }

    const transactions = await Transaction.find({ 
      customerId: userId, 
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE } ,
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
    .populate("customerId")
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ [sortField] : sortBy })
    // .skip(skip)
    // .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      customerId: userId,
      // status: { $ne: TRANSACTION_STATUS.PENDING }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE } ,
      transactionType:TRANSACTION_TYPE.PARENT
    });
    const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      totalPages,
      currentPage: page,
      totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listCompletedTransactionOfVender = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const { fromDate, toDate,sortField = 'transactionDate', sortBy = -1 } = req.query;

    let dateFilter: any = {};
    if (fromDate) {
      const correctedFromDate = moment(fromDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').toISOString();
      dateFilter.$gte = new Date(correctedFromDate);
    }
    if (toDate) {
      const correctedToDate = moment(toDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').add(1, 'day').toISOString();
      dateFilter.$lt = new Date(correctedToDate);
    }

    const transactions = await Transaction.find({ 
      venderId: userId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
      .populate("customerId")
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
      .populate({
        path: "childTransaction"
      })
      .sort({ [sortField] : sortBy })
    // .skip(skip)
    // .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      venderId: userId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
    });
    const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      totalPages,
      currentPage: page,
      totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listCompleteTransactionUsingVenderId = async (req: any, res: any) => {
  try {
    const { userId } = req.user;
    const { venderId } = req.params;

    if (!venderId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const { sortField = 'transactionDate', sortBy = -1 } = req.query;

    const transactions = await Transaction.find({
      customerId: userId,
      venderId: venderId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
    })
    .populate("customerId")
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ [sortField] : sortBy })
    // .skip(skip)
    // .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      customerId: userId,
      venderId: venderId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
    });
    const totalPages = Math.ceil(totaltransactions / limit);

    return buildObjectResponse(res, {
      transactions,
      totalPages,
      currentPage: page,
      totalItems: totaltransactions,
    });
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listTodayDueDateTransactionsOfVender = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    if (!userId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    const findVender=await User.findById(userId);
    
    if(!findVender)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    const findRole=await Role.findById(findVender?.role);

    if(findRole?.role == roles.Customer){
      return buildErrorResponse(res, constants.errors.venderRole, 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const { sortField = 'transactionDate', sortBy = -1 } = req.query;

    const today = new Date();
    const currentDay = today.getDate().toString().padStart(2, '0');    
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0'); 
    const currentYear = today.getFullYear().toString(); 

    const transactions = await Transaction.find({
      venderId: userId,
      transactionType: TRANSACTION_TYPE.PARENT,
      transactionStatus:TRANSACTION_STATUS.PENDING,
      $expr: {
        $and: [
          { $eq: [{ $dayOfMonth: "$dueDate" }, currentDay] },
          { $eq: [{ $month: "$dueDate" }, currentMonth] }, 
          { $eq: [{ $year: "$dueDate" }, currentYear] }    
        ]
      }
    })
    .populate("customerId")
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ [sortField] : sortBy })

    // const totalPendingAmount = transactions.reduce((total, transaction) => {
    //   let parentAmount = transaction.amount ? parseFloat(transaction.amount.toString()) : 0;
    //   if (transaction.childTransaction && transaction.childTransaction.length > 0) {
    //     transaction.childTransaction.forEach((child: any) => {
    //       if (child.transactionStatus === TRANSACTION_STATUS.COMPLETE) {
    //         const childAmount = child.amount ? parseFloat(child.amount.toString()) : 0;
    //         parentAmount -= childAmount; 
    //       }
    //     });
    //   }

    //   return total + parentAmount;
    // }, 0);

    return buildObjectResponse(res, {
      transactions
    });

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listCustomerPartTransactionsByVender = async (req: any, res: any) => {
  try {
    const { userId } = req.user;
    const {customerId}=req.params;

    if (!customerId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    const findCustomer=await User.findById(customerId);
    
    if(!findCustomer)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    const findRole=await Role.findById(findCustomer?.role);

    if(findRole?.role == roles.Vender){
      return buildErrorResponse(res, constants.errors.customerRole, 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { sortField = 'transactionDate', sortBy = -1 } = req.query;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      venderId: userId,
      customerId:customerId,
      transactionType: TRANSACTION_TYPE.PARENT
    })
    .populate("customerId")
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ [sortField] : sortBy })

    return buildObjectResponse(res, {
      transactions
    });

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const listPendingTransactionsUsingVender = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const findCustomerUser=await User.findById(userId)
    if(!findCustomerUser){
      return buildObjectResponse(res, {transactions:[]});
    }

    let roleData = await Role.findById(findCustomerUser.role)

    let transactions:any={}
    let customerTransactions:any=[]
    let venderTransactions:any=[]
    const { sortField = 'transactionDate', sortBy = -1 } = req.query;

    if (roleData?.role === roles.Vender) {
      const allTransactions = await Transaction.find({
        $or: [
          { venderId: userId },
          { customerId: userId }
        ],
        transactionType: TRANSACTION_TYPE.PARENT,
        transactionStatus: { $in: [
          TRANSACTION_STATUS.PENDING, 
          TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL, 
          TRANSACTION_STATUS.PARTIAL_DONE,
          TRANSACTION_STATUS.CUSTOMER_PAID
        ] }
      })
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
      .populate({
        path: "customerId",
        populate: {
          path: "role",
        },
      })
      .populate({
        path: "childTransaction"
      })
      .sort({ [sortField] : sortBy })
      

      allTransactions?.forEach((item:any)=>{
        if(item?.customerId?.role?.role == roles.Vender){
          venderTransactions.push(item);
        }else{
          customerTransactions.push(item);
        }
      })
    }else{
      venderTransactions = await Transaction.find({
        customerId: userId,
        transactionType: TRANSACTION_TYPE.PARENT,
        transactionStatus: { $in: [
          TRANSACTION_STATUS.PENDING, 
          TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL, 
          TRANSACTION_STATUS.PARTIAL_DONE,
          TRANSACTION_STATUS.CUSTOMER_PAID
        ] }
      })
      .populate({
        path: "venderId",
        populate: {
          path: "shopId",
        },
      })
      .populate({
        path: "customerId",
        populate: {
          path: "role",
        },
      })
      .populate({
        path: "childTransaction"
      })
      .sort({ [sortField] : sortBy })
    }

    return buildObjectResponse(res, {
      transactions:{
        customerTransactions,
        venderTransactions
      }
    });

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const uploadScreenShotofPayment = async (req: any, res: any) => {
  try {
    const { transactionId, paymentImage } = req.body;

    if (!transactionId)
      return buildErrorResponse(res,constants.errors.invalidTransactionId,400);

    if (!paymentImage)
      return buildErrorResponse(res,constants.errors.invalidPaymentImage,400);

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    if (!Array.isArray(findTransaction.transactionProofs)) {
      findTransaction.transactionProofs = [];
    }

    findTransaction.transactionProofs.push({
      type: "paymentScreenshot",
      imageUrl: paymentImage,
      uploadedAt: new Date(),
    });

    // Save the updated transaction
    await findTransaction.save();

    return buildResponse(res,constants.success.ssAddedSuccess,200);

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

const calculateCreditScore=async(userId:any)=>{
  const user:any = await User.findById(userId);
  const transactions = await Transaction.find({ 
    customerId: userId, 
    transactionType:TRANSACTION_TYPE.PARENT,
  })

  const result: any = await Wallet.findOne({userId});
  
  const baseAmount = (result?.credit as number) ?? 0;

  // if (transactions.length <= 10) {
  //   return {
  //     normalizedScore: baseAmount,
  //     normalizedScoreWithOutBase: 0,
  //   };
  // }


  const createdAt = moment(user.createdAt);
  const currentDate = moment();
  const yearsAsCustomer = currentDate.diff(createdAt, "years");

  let totalOnTimePayments = 0;
  let totalPayments = 0;
  let totalPenaltyPoints = 0;
  let totalConsistencyFactor = 0;
  let loyaltyFactor = 0;
  let baseLoyaltyPoints = 10;
  let onTimePaymentRatio = 0;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  transactions.forEach((transaction:any) => {
    const dueDate = new Date(transaction.dueDate);
    const amountPaidDates = transaction.amountPaidDates.map((d:any) => new Date(d));
    const transactionDate = new Date(transaction.transactionDate);

    // Step 1: On-Time Payment Ratio
    const onTimePayments = amountPaidDates.filter((date:any) => date <= dueDate).length;
    
    totalOnTimePayments += onTimePayments;
    totalPayments += amountPaidDates.length;

    // Step 2: Consistency Factor
    const recentOnTimePayments = amountPaidDates
      .filter((date:any) => date >= threeMonthsAgo && date <= dueDate).length;
      totalConsistencyFactor += recentOnTimePayments

    // Step 3: Penalty Points
    const penaltyPoints = amountPaidDates
      .filter((date:any) => date > dueDate)
      .reduce((points:any, date:any) => {
        const delayDays = Math.ceil((date.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (delayDays <= 10) return points + 2;
        if (delayDays <= 29) return points + 3;
        if (delayDays <= 49) return points + 5;
        if (delayDays <= 89) return points + 7;
        if (delayDays <= 149) return points + 10;
        return points + 20;
      }, 0);
    totalPenaltyPoints += penaltyPoints;

  });

  onTimePaymentRatio = totalPayments > 0 ? totalOnTimePayments / totalPayments : 0;

  // Step 4: Loyalty Factor
  loyaltyFactor = (yearsAsCustomer * onTimePaymentRatio) * baseLoyaltyPoints;

  // Step 6: Final Credit Score
  const consistencyFactor = totalConsistencyFactor / transactions.length;
  const averageLoyaltyFactor = loyaltyFactor / transactions.length;
  
  const creditScore = (onTimePaymentRatio * 0.2) + (consistencyFactor * 0.2) - (totalPenaltyPoints * 0.4 / transactions.length) + (averageLoyaltyFactor * 0.2);

  const normalizedScore = (creditScore / 10) * 1000 + baseAmount; 
  const normalizedScoreWithOutBase = (creditScore / 10) * 1000 ; 

  return {
    normalizedScore: Math.round(Math.max(0, Math.min(normalizedScore, 1000))),
    normalizedScoreWithOutBase:Math.round(Math.max(0, Math.min(normalizedScoreWithOutBase, 1000)))
  };
}