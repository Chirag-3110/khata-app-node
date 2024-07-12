import express from 'express';
import http from 'http';
import mongoConnect from './database/mongo';
import userRoute from './routes/userRoute';
import roleRoute from './routes/roleRoute';
import adRoute from './routes/adRoute';
import notificationRoute from './routes/notificationRoute';
import customerRoute from './routes/customerRoute';
import walletRoute from './routes/walletRoute';
import transactionRoute from './routes/transactionRoute';

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
app.use(adRoute);
app.use(notificationRoute);
app.use(customerRoute);
app.use(walletRoute);
app.use(transactionRoute);
