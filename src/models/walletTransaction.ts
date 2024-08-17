import { Schema, model, Document } from 'mongoose';

interface WalletTransaction extends Document {
    walletAddress: Schema.Types.ObjectId;
    amount:string;
    transactionType:string;
    module:string;
    createdAt: Date;
    updatedAt: Date;
}

const WalletTransactionSchema = new Schema<WalletTransaction>({
    walletAddress: {
        type: Schema.Types.ObjectId,
        required:true
    },
    amount: {
        type: String,
        required:true
    },
    transactionType: {
        type: String,
        required:true
    },
    module: {
        type: String,
        required:true
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

const WalletTransaction = model<WalletTransaction>('wallettransaction', WalletTransactionSchema);

export default WalletTransaction;
