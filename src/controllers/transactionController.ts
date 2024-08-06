import mongoose, { Types } from "mongoose";
import { TRANSACTION_STATUS, TRANSACTION_TYPE, constants, roles } from "../constants";
import User from "../models/user";
import {buildErrorResponse,buildObjectResponse,buildResponse,} from "../utils/responseUtils";
import Transaction from "../models/Transaction";
import Wallet from "../models/Wallet";
const moment = require("moment");

export const createNewTransaction = async (req: any, res: any) => {
  const { userId, amount, dueDate, venderId } = req.body;
  try {
    if (!userId)
      return buildErrorResponse(res, constants.errors.invalidUserId, 404);

    if (!amount)
      return buildErrorResponse(res, constants.errors.amountRequired, 404);

    if (!dueDate)
      return buildErrorResponse(res, constants.errors.invalidDueDate, 404);

    const transactionData = {
      customerId: userId,
      venderId: venderId,
      amount: amount,
      dueDate: dueDate,
      status: TRANSACTION_STATUS.PENDING,
      transactionStatus: TRANSACTION_STATUS.PENDING,
      transactionType:TRANSACTION_TYPE.PARENT
    };

    const transaction = new Transaction(transactionData);

    await transaction.save();

    return buildResponse(res, constants.success.transactionDone, 200);
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

    const transactions = await Transaction.find({ 
      venderId: userId,
      status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
      transactionType:TRANSACTION_TYPE.PARENT
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

export const listTransactionsOfCustomers = async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ 
      customerId: userId, 
      status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE } ,
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

export const payAmountToVender = async (req: any, res: any) => {
  try {
    const { transactionId, amount } = req.body;
    const { userId } = req.user;

    if (!transactionId)
      return buildErrorResponse(
        res,
        constants.errors.invalidTransactionId,
        404
      );

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    if (findTransaction.status === TRANSACTION_STATUS.COMPLETE)
      return buildErrorResponse(
        res,
        constants.errors.transactionIsCompleted,
        404
      );

    const numberValue = parseFloat(findTransaction.amount.toString());

    let finalAmountAfterPartial = amount;

    const childTransactionIds = findTransaction.childTransaction || [];

    if (childTransactionIds.length > 0) {
      const childTransactions = await Transaction.find({
        _id: { $in: childTransactionIds },
      });
      const childTransactionAmount = childTransactions.reduce(
        (sum, child) => sum + parseFloat(child.amount.toString()),
        0
      );
      finalAmountAfterPartial = numberValue - childTransactionAmount;
    }

    console.log(typeof amount, typeof finalAmountAfterPartial, "ss");

    const date1Only = moment(findTransaction.dueDate).startOf("day");
    const date2Only = moment().startOf("day");

    const checkUserExists = await User.findById(userId);

    const result = await Wallet.findById(checkUserExists?.walletId);
    const currentCredit = (result?.credit as number) ?? 0;

    if (date2Only.isSameOrBefore(date1Only)) {
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { status: TRANSACTION_STATUS.CUSTOMER_PAID },
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
                  $push: { childTransaction: childTransaction._id },
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
      return buildResponse(res, constants.success.transactionDone, 200);
    } else {
      console.log("date1 is after date2");
      if (amount == numberValue) {
        await Transaction.findByIdAndUpdate(
          transactionId,
          { status: TRANSACTION_STATUS.CUSTOMER_PAID },
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
              $push: { childTransaction: childTransaction._id },
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
      return buildResponse(res, constants.success.transactionDone, 200);
    }
  } catch (error) {
    console.log(error, "error");
    return buildErrorResponse(res, constants.errors.internalServerError, 500);
  }
};

export const updateDueDateByCustomer = async (req: any, res: any) => {
  try {
    const { transactionId, dueDate } = req.body;

    if (!transactionId)
      return buildErrorResponse(
        res,
        constants.errors.invalidTransactionId,
        404
      );

    const findTransaction = await Transaction.findById(transactionId);

    if (!findTransaction)
      return buildErrorResponse(res, constants.errors.transactionNotFound, 404);

    const dueDateUpdatedCount =
      (findTransaction.dueDateUpdatedCount
        ? findTransaction.dueDateUpdatedCount.valueOf()
        : 0) + 1;

    if (findTransaction?.dueDateUpdatedCount == 1)
      return buildErrorResponse(
        res,
        constants.errors.transactionDueDateUpdate,
        406
      );

    await Transaction.findByIdAndUpdate(
      transactionId,
      { dueDate: dueDate, dueDateUpdatedCount: dueDateUpdatedCount },
      { new: true }
    );

    return buildResponse(res, constants.success.transactionDueDateUpdate, 200);
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

export const listTransactionUsingVenderId = async (req: any, res: any) => {
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
      status: { $ne: TRANSACTION_STATUS.COMPLETE }, 
      transactionStatus: { $ne: TRANSACTION_STATUS.COMPLETE },
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
