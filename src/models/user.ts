import { Schema, model, Document } from 'mongoose';

interface User extends Document {
    name: string;
    email: string;
    status: boolean;
    role: Schema.Types.ObjectId;
    shopId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    documentId: string;
    deviceToken: string[];
    activeStatus: boolean;
    walletId: Schema.Types.ObjectId;
    isEmailVerified: boolean;
    address: string;
    dob: string;
    gender: string;
    qrCode: string;
    upiId: string;
    isProfileDone:boolean;
}

const userSchema = new Schema<User>({
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required:true
    },
    status: {
        type: Boolean,
        default: true,
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'roles', 
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'shop',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    documentId: {
        type: String,
        required:true
    },
    deviceToken: [{
        type: String,
    }],
    activeStatus: {
        type: Boolean,
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'wallet',
    },
    isEmailVerified: {
        type: Boolean,
        default:false
    },
    address: {
        type: String,
    },
    dob: {
        type: String,
    },
    gender: {
        type: String,
    },
    qrCode: {
        type: String,
    },
    upiId: {
        type: String,
    },
    isProfileDone: {
      type:Boolean,
      default: false,
    }
});

const User = model<User>('user', userSchema);

export default User;
