import { Schema, model, Document } from 'mongoose';

interface Transaction extends Document {
  customerId: Schema.Types.ObjectId;
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
  customerId: {
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
    default: new Date()
  },
  transactionRef: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
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
