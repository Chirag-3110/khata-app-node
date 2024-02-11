import express from 'express';
import { addNewUser } from '../controllers/userController';
import { addNewChatRoom, addNewRoomMessage, getChatMessages, getChatRooms, getUnconnectedUseForChat } from '../controllers/chatController';
const chatRoute = express.Router();
const verifyToken = require("../middleware/auth");

chatRoute.post("/api/chat/createRoom",verifyToken,addNewChatRoom);
chatRoute.get("/api/chat/getRooms",verifyToken,getChatRooms);
chatRoute.get("/api/chat/getNewUserForChat",verifyToken,getUnconnectedUseForChat);
chatRoute.post("/api/chat/createNewMessage",verifyToken,addNewRoomMessage);
chatRoute.get("/api/chat/getChats/:roomId",verifyToken,getChatMessages);

export default chatRoute;