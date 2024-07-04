import { Schema, model, Document } from 'mongoose';

interface State extends Document {
    name: string;
    code: string;
}

const stateSchema = new Schema<State>({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
});

const State = model<State>('state', stateSchema);

export default State;
