import { Schema, model, Document } from 'mongoose';
import { NOTIFICATION_STATUS } from '../constants';

interface Reminder extends Document {
    customerId: Schema.Types.ObjectId;
    venderId: Schema.Types.ObjectId;
    transactionId: Schema.Types.ObjectId;
    description: string;
    reminderDate:Date;
    reminderMedium:string;
    createdAt: Date;
    updatedAt: Date;
}

const reminderSchema = new Schema<Reminder>({
  description: {
    type: String,
  },
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
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'transaction',
    required: true,
  },
  reminderDate: {
    type: Date,
    required: true,
  },
  reminderMedium: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },  
  updatedAt: {
      type: Date,
      default: Date.now,
  },
});

const Reminder = model<Reminder>('reminder', reminderSchema);

export default Reminder;
