import { Schema, model, Document, Types } from 'mongoose';

interface ChatMessages extends Document {
    chatRoomID:Schema.Types.ObjectId;
    userId:Schema.Types.ObjectId;
    message:string;
    createdAt:Date;
}

const ChatMessagesSchema = new Schema<ChatMessages>({
    chatRoomID: { 
        type: Schema.Types.ObjectId, 
        ref: 'ChatRoom',
        required:true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Users',
        required:true
    },
    message:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
});

const ChatMessagesModel = model<ChatMessages>('ChatMessages', ChatMessagesSchema);

export default ChatMessagesModel;
