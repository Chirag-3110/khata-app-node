import { Schema, model, Document } from 'mongoose';
import { NOTIFICATION_STATUS } from '../constants';

interface Refer extends Document {
    userId: Schema.Types.ObjectId;
    name: string;
    email: string;
    phoneNumber:string;
    referCode:string;
    creditAmount:string;
    isExipred:boolean;
    createdAt: Date;
    updatedAt: Date
}


const ReferSchema = new Schema<Refer>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    referCode: {
        type: String,
    },
    creditAmount: {
        type: String,
    },
    isExipred: {
        type: Boolean,
        default: false
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

const Refer = model<Refer>('refer', ReferSchema);

export default Refer;
