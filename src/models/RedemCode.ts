import { Schema, model, Document } from 'mongoose';

interface RedemCode extends Document {
    createdAt: Date;
    updatedAt: Date;
    userId: Schema.Types.ObjectId;
    redermCode:string;
    referedCodeUsers: Schema.Types.ObjectId[];
}


const RedemCodeSchema = new Schema<RedemCode>({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    redermCode: {
        type: String,
        required: true
    },
    referedCodeUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'user', 
        }
    ],
});

const RedemCode = model<RedemCode>('redemcode', RedemCodeSchema);

export default RedemCode;
