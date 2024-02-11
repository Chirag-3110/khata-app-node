import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoConnect from './database/mongo';
import userRoute from './routes/userRoute';
import chatRoute from './routes/chatRoute';
import User from './models/user';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const socketUserMap = new Map();

app.get('/', (req: any, res: any) => {
  res.send('hello world');
});

io.on('connection', (socket:any) => {
console.log('====================================');
console.log("connextx");
console.log('====================================');
  
  socket.on('user_id', async (userId: string) => {
    socket.userId = userId;
    try {
      await User.updateOne({ _id: userId }, { status: true });
      console.log(`User ${userId} status updated to true`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });   

    socket.on('message', (message:object) => {
      console.log('message:', message);
      io.emit('message', message);
    });
  
    socket.on('disconnect', async () => {
      console.log('a user disconnected');
      if (socket.userId) {
        try {
          await User.updateOne({ _id: socket.userId }, { status: false });
          console.log(`User ${socket.userId} status updated to false`);
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
    });
});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


server.listen(3000, () => {
    console.log('Server started at port 3000');
    mongoConnect();
});

app.use(userRoute);
app.use(chatRoute);