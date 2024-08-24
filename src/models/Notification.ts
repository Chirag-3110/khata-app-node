import { Schema, model, Document } from 'mongoose';
import { NOTIFICATION_STATUS } from '../constants';

interface Notification extends Document {
  title: string;
  description: string;
  userId: Schema.Types.ObjectId;
  status: string;
  notificationType: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<Notification>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  status: {
    type: String,
    default:NOTIFICATION_STATUS.UNSEEN,
  },
  notificationType: {
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

const Notification = model<Notification>('notification', notificationSchema);

export default Notification;
