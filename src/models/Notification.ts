import { Schema, model, Document } from 'mongoose';

interface Notification extends Document {
  title: string;
  description: string;
  userId: Schema.Types.ObjectId;
  status: string;
  notificationType: string;
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
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  notificationType: {
    type: String,
    required: true,
  },
});

const Notification = model<Notification>('notification', notificationSchema);

export default Notification;
