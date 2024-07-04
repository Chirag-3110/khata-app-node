import { Schema, model, Document } from 'mongoose';

interface Role extends Document {
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

const roleSchema = new Schema<Role>({
    role: {
        type: String
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

const Role = model<Role>('roles', roleSchema);

export default Role;
