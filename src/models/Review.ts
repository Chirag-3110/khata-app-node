import { Schema, model, Document } from 'mongoose';

interface Review extends Document {
    customerId: Schema.Types.ObjectId;
    shopId: Schema.Types.ObjectId;
    description:string;
    ratings:Number;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<Review>({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    description: {
        type: String,
        required:true
    },
    ratings: {
        type: Number,
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

const Review = model<Review>('Review', ReviewSchema);

export default Review;
