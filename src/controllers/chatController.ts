import { Types } from "mongoose";
import ChatMessagesModel from "../models/chatMessage";
import ChatRoomModel from "../models/chatRoom";
import User from "../models/user";


// Query related to chat rooms
export const addNewChatRoom = async (req:any,res:any) => {
    try {
        const {users} = req.body;
        
        const chatRoomInstance = new ChatRoomModel({ users: users });

        const respone = await chatRoomInstance.save();

        res.status(200).send({response:respone,statusCode:200});

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error",statusCode:500})
    }
}

export const getChatRooms = async (req:any,res:any) => {
    try {
        const {userId} = req.user;

        const userChatRoom = await ChatRoomModel.find({ 
            users: userId
         })
         .populate('users', '-__v -createdAt')
         .populate("lastMessage","message createdAt");
        
        res.status(200).send({response:userChatRoom,statusCode:200})

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error",statusCode:500})
    }
}

export const getUnconnectedUseForChat = async (req:any,res:any) => {
    try {

      const {userId}=req.user;

      const connectedUsers = await ChatRoomModel.find({ users: userId }, { users: 1 });
      const connectedUserIds = connectedUsers.map(room => room.users).flat(); 
      const unconnectedUsers = await User.find({ _id: { $nin: connectedUserIds, $ne: userId } }, { password: 0 }); // Exclude the provided userId and the password field
  
      console.log(unconnectedUsers);
      res.status(200).send({response:unconnectedUsers,statusCode:200})

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error",statusCode:500})
    }
}

// Query related to chat messages
export const addNewRoomMessage = async (req:any,res:any) => {
    try {
        const {userId} = req.user;
        const {chatRoomID,message} = req.body;
        const messageData={
            chatRoomID:chatRoomID,
            userId:userId,
            message:message,
        }
        const chatMessageRef = new ChatMessagesModel(messageData);

        const respone = await chatMessageRef.save();

        if(chatMessageRef){
            const updateResult = await ChatRoomModel.findByIdAndUpdate(
                chatRoomID,
                { lastMessage: respone._id },
                { new: true }
            );
            res.status(200).send({response:respone,statusCode:200});
        }
        else{
            res.status(401).send({error:"Chat room not found",statusCode:401})
        }

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error",statusCode:500})
    }
}

export const getChatMessages = async (req:any,res:any) => {
    try {
        const {roomId} = req.params;        

        const userChatMessages = await ChatMessagesModel.find({ chatRoomID: roomId})
            .populate('userId', '-__v -createdAt -email -password')
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.status(200).send({response:userChatMessages,statusCode:200})

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error",statusCode:500})
    }
}

