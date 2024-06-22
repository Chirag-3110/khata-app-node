import express from 'express';
import http from 'http';
import mongoConnect from './database/mongo';
import userRoute from './routes/userRoute';

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


server.listen(3000, () => {
    console.log('Server started at port 3000');
    // mongoConnect();
});

app.use("/",(req:any,res:any)=>{
    res.send("Hello New World runner")
})
app.use(userRoute);
