import { Schema, model, Document } from 'mongoose';
import { number } from 'yup';

export interface DeviceInfoInterface extends Document {
    deviceId: string;
    fcmToken: string;
    os: string;
}
interface User extends Document {
    name: string;
    email: string;
    status: boolean;
    role: Schema.Types.ObjectId;
    shopId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    deviceToken: DeviceInfoInterface[];
    activeStatus: boolean;
    walletId: Schema.Types.ObjectId;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    address: string;
    dob: string;
    gender: string;
    qrCode: string;
    upiId: string;
    isProfileDone:boolean;
    phoneNumber:string;
    redeemCode:Schema.Types.ObjectId,
    pinCode: string
}


const userSchema = new Schema<User>({
    name: {
        type: String,
    },
    email: {
        type: String,
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
    deviceToken: [
        new Schema(
            {
              deviceId: {
                type: String
              },
              os: {
                type: String
              },
              fcmToken: {
                type: String
              }
            },
            { _id: false, timestamps: true }
        )
    ],
    activeStatus: {
        type: Boolean,
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'wallet',
    },
    isEmailVerified: {
        type: Boolean,
        default:true
    },
    isPhoneVerified: {
        type: Boolean,
        default:true
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
    },
    phoneNumber:{
        type:String,
        unique: true,
    },
    redeemCode: {
        type: Schema.Types.ObjectId,
        ref: 'redemcode', 
    },
    pinCode:{
        type:String,
    }
});

const User = model<User>('user', userSchema);

export default User;
