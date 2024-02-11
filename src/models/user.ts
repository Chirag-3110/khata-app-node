import { Schema, model,Document } from 'mongoose';

interface User extends Document {
    name: string;
    email: string;
    password: string;
    status:boolean;
}

const userSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  status:{
    type:Boolean,
    default:true
  }
});

const User = model<User>('Users', userSchema);

export default User;