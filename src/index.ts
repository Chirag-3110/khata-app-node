import express from 'express';
import http from 'http';
import mongoConnect from './database/mongo';
import userRoute from './routes/userRoute';
import roleRoute from './routes/roleRoute';

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


server.listen(3000, () => {
    console.log('Server started at port 3000');
    mongoConnect();
});

app.get("/",(req:any,res:any)=>{
    res.send("Server is UP!")
});

app.use(userRoute);
app.use(roleRoute);
