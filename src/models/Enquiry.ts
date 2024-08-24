import { Schema, model, Document } from 'mongoose';
import { ENQUIRY_STATUS } from '../constants';

interface Category extends Document {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<Category>({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const Category = model<Category>('categories', CategorySchema);

interface Enquiry extends Document {
    createdAt: Date;
    updatedAt: Date;
    category: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    venderId: Schema.Types.ObjectId;
    status: string;
    description: string;
    feedbacks: {
        comment: string;
        createdAt: Date;
        userId: Schema.Types.ObjectId;
    }[];
}

const EnquirySchema = new Schema<Enquiry>({
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
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
        ref: "user",
        required: true,
    },
    venderId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    status: {
        type: String,
        default: ENQUIRY_STATUS.OPEN,
    },
    description: {
        type: String,
        required: true,
    },
    feedbacks: [
        {
            comment: {
                type: String,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            userId: {
                type: Schema.Types.ObjectId,
                ref: "user",
            },
        }
    ],
});

const Enquiry = model<Enquiry>('enquiry', EnquirySchema);

export { Enquiry, Category };
