import { Schema, model, Document } from 'mongoose';

interface Transaction extends Document {
  customerId: Schema.Types.ObjectId;
  venderId: Schema.Types.ObjectId;
  amount: Schema.Types.Decimal128; 
  transactionDate: Date;
  transactionRef: string;
  status: string;
  transactionType: string;
  dueDate: Date;
  childTransaction: Schema.Types.ObjectId[];
  dueDateUpdatedCount:Number;
  transactionStatus:string,
  dueDateStatus:string,
  requestedDueDate:Date,
  otp:string,
  description:string,
  createdBy:string,
  amountPaidDates:Date[],
  transactionProofs:object[],
}

const transactionSchema = new Schema<Transaction>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  venderId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  amount: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  transactionDate: {
    type: Date,
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
  childTransaction: [
    {
      type: Schema.Types.ObjectId,
      ref: 'transaction',
    },
  ],
  dueDateUpdatedCount:{
    type:Number,
    default:0
  },
  transactionStatus:{
    type: String,
    required: true,
  },
  dueDateStatus:{
    type: String,
  },
  requestedDueDate:{
    type: Date,
  },
  otp:{
    type: String,
  },
  description:{
    type: String,
  },
  createdBy:{
    type: String,
  },
  amountPaidDates: {
    type: [Date],
    default: []
  },
  transactionProofs: {
    type: [Object],
    default: []
  },
});

const Transaction = model<Transaction>('transaction', transactionSchema);

export default Transaction;
