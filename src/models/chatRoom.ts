import { Schema, model, Document, Types } from 'mongoose';

interface ChatRoom extends Document {
    users: Types.ObjectId[];
    lastMessage: Types.ObjectId;
    createdAt:Date
}

const chatRoomSchema = new Schema<ChatRoom>({
    users: [{ type: Schema.Types.ObjectId, ref: 'Users',required:true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'ChatMessages',default:null },
    createdAt:{
        type:Date,
        default:Date.now()
    }
});

const ChatRoomModel = model<ChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
