import { Schema, model, Document } from 'mongoose';
import { boolean, number } from 'yup';

interface Customer extends Document {
    createdAt: Date;
    updatedAt: Date;
    role:Schema.Types.ObjectId;
    customerId:Schema.Types.ObjectId;
    venderId:Schema.Types.ObjectId,
    activeStatus:boolean
}

const CustomerSchema = new Schema<Customer>({
    role: {
        type: Schema.Types.ObjectId,
        ref: 'roles', 
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    customerId:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    venderId:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    activeStatus:{
        type:Boolean,
        default:true
    }
});

const Customer = model<Customer>('Customer', CustomerSchema);

export default Customer;
