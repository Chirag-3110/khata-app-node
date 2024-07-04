import { Schema, model, Document } from 'mongoose';

interface Transaction extends Document {
  userId: Schema.Types.ObjectId;
  walletId: Schema.Types.ObjectId;
  amount: Schema.Types.Decimal128; 
  transactionDate: Date;
  transactionRef: string;
  status: string;
  transactionType: string;
  dueDate: Date;
  childTransaction: Schema.Types.ObjectId;
}

const transactionSchema = new Schema<Transaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'wallet',
    required: true,
  },
  amount: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  transactionDate: {
    type: Date,
    required: true,
  },
  transactionRef: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  childTransaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
  },
});

const Transaction = model<Transaction>('transaction', transactionSchema);

export default Transaction;
