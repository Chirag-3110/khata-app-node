import { Schema, model, Document } from 'mongoose';

interface Subscription extends Document {
    name: string;
    validTill:string;
    description:string;
    price:string;
    createdAt: Date;
    updatedAt: Date
}


const SubscriptionSchema = new Schema<Subscription>({
    name: {
        type: String,
    },
    validTill: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: String,
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

const Subscription = model<Subscription>('subscription', SubscriptionSchema);

export default Subscription;
