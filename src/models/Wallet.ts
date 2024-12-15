import { Schema, model, Document } from 'mongoose';

interface Wallet extends Document {
    userId: Schema.Types.ObjectId;
    credit: Number;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<Wallet>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    credit: {
        type: Number,
        default:50
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

const Wallet = model<Wallet>('wallet', walletSchema);

export default Wallet;
