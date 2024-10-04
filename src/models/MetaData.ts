import { Schema, model, Document } from 'mongoose';

interface MetaData extends Document {
    createdAt: Date;
    updatedAt: Date;
    description: string;
    title: string;
}

const MetaDataSchema = new Schema<MetaData>({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    }
});

const MetaData = model<MetaData>('metadata', MetaDataSchema);

export { MetaData };
