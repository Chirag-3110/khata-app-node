import { Schema, model, Document } from 'mongoose';
import { boolean, number } from 'yup';

interface Enquiry extends Document {
    createdAt: Date;
    updatedAt: Date;
    category:Schema.Types.ObjectId;
    userId:Schema.Types.ObjectId;
    venderId:Schema.Types.ObjectId;
    status:string;
    description:string;
    feedbacks: object[]
}

const EnquirySchema = new Schema<Enquiry>({
    // role: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'roles', 
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    // EnquiryId:{
    //     type:Schema.Types.ObjectId,
    //     ref:"user"
    // },
    venderId:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    // activeStatus:{
    //     type:Boolean,
    //     default:true
    // }
});

const Enquiry = model<Enquiry>('enquiry', EnquirySchema);

export default Enquiry;
