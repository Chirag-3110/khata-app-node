import { Schema, model, Document } from 'mongoose';

interface Otp extends Document {
    userId: Schema.Types.ObjectId;
    otp: number;
}

const otpSchema = new Schema<Otp>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    otp: {
        type: Number,
        required: true,
    },
});

const Otp = model<Otp>('otp', otpSchema);

export default Otp;