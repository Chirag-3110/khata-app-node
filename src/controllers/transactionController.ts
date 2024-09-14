import mongoose, { Types } from "mongoose";
import { DUE_DATE_STATUS, FIREBASE_NOTIFICATION_MESSAGES, NOTIFICATION_TYPE, TRANSACTION_MODULES, TRANSACTION_STATUS, TRANSACTION_TYPE, WALLET_TRANSACTION_TYPE, constants, roles } from "../constants";
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
const moment = require("moment");

export const createNewTransaction = async (req: any, res: any) => {
  const { userId, amount, dueDate, venderId, description, createdBy } = req.body;

  try {
    if (!userId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    if (!amount)
      return buildErrorResponse(res, constants.errors.amountRequired, 404);

    if (!dueDate)
      return buildErrorResponse(res, constants.errors.invalidDueDate, 404);

    const findUser=await User.findById(userId);
    const findVender=await User.findById(venderId);
    
    if(!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if(!findVender)
      return buildErrorResponse(res, constants.errors.userNotVender, 404);

    const isCustomerExits=await Customer.findOne({customerId:userId,venderId})
console.log(isCustomerExits,"Cuteomrexists");

    if(!isCustomerExits){
      const findFraud=await Frauds.findOne({fraudsterId:userId});
      if(findFraud && (findFraud?.fraudsCount?.valueOf() > 3)){
        return buildErrorResponse(res, constants.errors.customerBlocked, 404);
      }
      
      const findNewUser=await User.findById(req?.user?.userId);
      const customerData = {
        role: findNewUser?.role,
        venderId: venderId,
        customerId: userId
      }
console.log(customerData,"ss");

      const user = new Customer(customerData);
      await user.save();
    }else{
      if(!isCustomerExits?.activeStatus){
        return buildErrorResponse(res, constants.errors.customerBlocked, 401);
      }
    }

    const otp = await generateOTP();

    let transactionData = {
      customerId: userId,
      venderId: venderId,
      amount: amount,
      dueDate: dueDate,
      status: createdBy == roles.Vender?TRANSACTION_STATUS.PRE_PENDING:TRANSACTION_STATUS.PENDING,
      transactionStatus: createdBy == roles.Vender?TRANSACTION_STATUS.PRE_PENDING:TRANSACTION_STATUS.PENDING,
      transactionType: TRANSACTION_TYPE.PARENT,
      dueDateStatus: DUE_DATE_STATUS.PENDING,
      description:description,
      otp:"0000",
      // otp:otp,
      createdBy:createdBy?createdBy:roles.Vender,
      transactionRef:generateRandomTransactionRef(),
      transactionDate: moment().format()
    }

    console.log(transactionData,'Data');
    

    const transaction = new Transaction(transactionData);

    const response = await transaction.save();

    if(createdBy !== roles.Customer){
      const notificationBody={
        title:"Transaction initialization",
        description:`${otp} is your transaction otp. please share this otp with the vender for transaction completion`,
        notificationType:NOTIFICATION_TYPE.TRANSACTION,
        userId:userId
      }
      const notification=new Notification(notificationBody);
      await notification.save();

      let message=FIREBASE_NOTIFICATION_MESSAGES.transaction.message.replace('{{userName}}', findVender?.name).replace('{{otp}}', otp)
      let title = FIREBASE_NOTIFICATION_MESSAGES.transaction.type;

      const tokens: string[] = [];
      findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
      await sendNotification("Transaction Created",message,tokens,{type:title,transactionId:response?._id})

    }

    return buildObjectResponse(res, {transactonId:response?._id});
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const verifyTransaction = async (req: any, res: any) => {
  const { transactionId, otp } = req.body;
  try {
    if (!transactionId)
      return buildErrorResponse(res, constants.errors.invalidTransactionId, 404);

    if (!otp)
      return buildErrorResponse(res, constants.errors.emptyOtp, 404);

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    console.log(findTransaction?.otp,"find",otp)

    const findUser=await User.findById(findTransaction.venderId)
console.log(findUser,'ss');

    if (!findUser)
      return buildErrorResponse(res, constants.errors.userNotFound, 404);

    if(findTransaction?.otp !== otp)
      return buildErrorResponse(res, constants.errors.invalidOtp, 404);

    await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: TRANSACTION_STATUS.PENDING,
        transactionStatus: TRANSACTION_STATUS.PENDING
      },
      { new: true }
    );

    const notificationBodies = [
      {
        title: "Transaction completed",
        description: `Your transaction is successfully completed with the vendor`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: findTransaction?.customerId,
      },
      {
        title: "Transaction completed",
        description: `Your transaction is successfully completed`,
        notificationType: NOTIFICATION_TYPE.TRANSACTION,
        userId: findTransaction?.venderId,
      },
    ];
    
    await Notification.insertMany(notificationBodies);

    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_verify.message;
    let title = FIREBASE_NOTIFICATION_MESSAGES.transaction_verify.type;

    const tokens: string[] = [];
    findUser?.deviceToken?.map((device: any) => tokens.push(device?.fcmToken));
    if(tokens?.length>0){
      await sendNotification("Transaction Verified",message,tokens,{type:title})
    }

    return buildResponse(res, constants.success.transactionSuccesfullStarted ,200);
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const payAmountToVender = async (req: any, res: any) => {
  try {
    const { transactionId, amount } = req.body;
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

    console.log(typeof amount, typeof finalAmountAfterPartial, "ss");

    const date1Only = moment(findTransaction.dueDate).startOf("day");
    const date2Only = moment().startOf("day");

    const checkUserExists = await User.findById(userId);

    const result = await Wallet.findById(checkUserExists?.walletId);
    const currentCredit = (result?.credit as number) ?? 0;
    const currentDate = new Date();

    if (date2Only.isSameOrBefore(date1Only)) {
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { 
            status: TRANSACTION_STATUS.CUSTOMER_PAID,
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
                transactionType:TRANSACTION_TYPE.CHILD
            };

            const transaction = new Transaction(transactionData);
            const childTransaction = await transaction.save();

            await Transaction.findByIdAndUpdate(
                transactionId,
                {
                  status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
                  $push: { childTransaction: childTransaction._id, amountPaidDates: currentDate },
                },
                { new: true }
            );
            console.log("partial done");
        }
      }
      await Wallet.findByIdAndUpdate(
        checkUserExists?.walletId,
        { credit: currentCredit + 2 },
        { new: true }
      );
      const walletData={
        walletAddress: checkUserExists?.walletId,
        amount: 2,
        transactionType:WALLET_TRANSACTION_TYPE.DEPOSIT,
        module:TRANSACTION_MODULES.TRANSACTION
      }
      const walletTransaction=new WalletTransaction(walletData);
      await walletTransaction.save();
    } else {
      console.log("date1 is after date2");
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { 
            status: TRANSACTION_STATUS.CUSTOMER_PAID,
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
            transactionType:TRANSACTION_TYPE.CHILD
          };

          const transaction = new Transaction(transactionData);
          const childTransaction = await transaction.save();

          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: TRANSACTION_STATUS.CUSTOMER_PAID_PARTIAL,
              $push: { childTransaction: childTransaction._id, amountPaidDates: currentDate },
            },
            { new: true }
          );
          console.log("partial done");
        }
      }
      await Wallet.findByIdAndUpdate(
        checkUserExists?.walletId,
        { credit: currentCredit - 5 },
        { new: true }
      );
      const walletData={
        walletAddress: checkUserExists?.walletId,
        amount: 5,
        transactionType: WALLET_TRANSACTION_TYPE.WITHDRAW,
        module: TRANSACTION_MODULES.TRANSACTION
      }
      const walletTransaction=new WalletTransaction(walletData);
      await walletTransaction.save();
    }
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

    let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_request.message.replace('{{userName}}', findUser?.name);
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (findTransaction.childTransaction.length === 0) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          {
            status: TRANSACTION_STATUS.COMPLETE,
            transactionStatus: TRANSACTION_STATUS.COMPLETE,
          },
          { new: true, session }
        );
      } else {
        await Transaction.findByIdAndUpdate(
          transactionId,
          {
            status: TRANSACTION_STATUS.COMPLETE,
            transactionStatus: TRANSACTION_STATUS.COMPLETE,
          },
          { new: true, session }
        );

        await Transaction.updateMany(
          { _id: { $in: findTransaction.childTransaction } },
          {
            transactionStatus: TRANSACTION_STATUS.COMPLETE,
            status: TRANSACTION_STATUS.COMPLETE,
          },
          { session }
        );
      }

      let message=FIREBASE_NOTIFICATION_MESSAGES.transaction_status_update.message.replace('{{venderName}}', findVender?.name);
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

    const { fromDate, toDate } = req.query;

    console.log(fromDate, toDate, 'dates');

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
      venderId: userId,
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType: TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
      .populate("customerId")
      .populate("venderId")
      .populate({
        path: "childTransaction"
      })
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const totaltransactions = await Transaction.countDocuments({
      venderId: userId,
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType: TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
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

export const listTransactionsOfCustomers = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const { fromDate, toDate } = req.query;

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
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ transactionDate: -1 });
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

    const { fromDate, toDate } = req.query;

    console.log(fromDate, toDate, 'dates');

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
      venderId: venderId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ transactionDate: -1 });
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

    const { fromDate, toDate } = req.query;

    console.log(fromDate, toDate, 'dates');

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
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE } ,
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ transactionDate: -1 });
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

    const { fromDate, toDate } = req.query;

    console.log(fromDate, toDate, 'dates');

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
      venderId: userId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT,
      ...(Object.keys(dateFilter).length && { transactionDate: dateFilter })
    })
      .populate("customerId")
      .populate("venderId")
      .populate({
        path: "childTransaction"
      })
      .sort({ transactionDate: -1 });
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

    const transactions = await Transaction.find({
      customerId: userId,
      venderId: venderId,
      // status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $eq: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
    })
    .populate({
      path: "venderId",
      populate: {
        path: "shopId",
      },
    })
    .populate({
      path: "childTransaction"
    })
    .sort({ transactionDate: -1 });
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

    const today = new Date();
    const currentDay = today.getDate().toString().padStart(2, '0');    
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0'); 
    const currentYear = today.getFullYear().toString(); 

    const transactions = await Transaction.find({
      venderId: userId,
      transactionType: TRANSACTION_TYPE.PARENT,
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
      path: "childTransaction"
    })
    .sort({ transactionDate: -1 });

    return buildObjectResponse(res, {
      transactions,
    });

  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};
