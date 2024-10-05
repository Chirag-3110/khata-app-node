import { Schema, model, Document } from 'mongoose';

interface Otp extends Document {
    customerId: Schema.Types.ObjectId;
    otp: string;
}

const otpSchema = new Schema<Otp>({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'customer',
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
});

const Otp = model<Otp>('otp', otpSchema);

export default Otp;