import { Schema, model, Document } from 'mongoose';
import { boolean, number } from 'yup';

interface Frauds extends Document {
    createdAt: Date;
    updatedAt: Date;
    fraudsterId: Schema.Types.ObjectId;
    fraudAddedByUserId: Schema.Types.ObjectId[],
    fraudsCount: Number,
    transactionIds: Schema.Types.ObjectId[]; 
    fraudDeclareDate: Date[]
}

const FraudsSchema = new Schema<Frauds>({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    fraudsterId:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    fraudAddedByUserId:[{
        type:Schema.Types.ObjectId,
        ref:"user"
    }],
    fraudsCount:{
        type:Number,
        default: 1
    },
    transactionIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'transaction',
        },
    ],
    fraudDeclareDate: {
        type: [Date],
        default: []
    },
});

const Frauds = model<Frauds>('Frauds', FraudsSchema);

export default Frauds;
