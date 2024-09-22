import express from 'express';
import http from 'http';
import cors from 'cors';

import mongoConnect from './database/mongo';
import userRoute from './routes/userRoute';
import roleRoute from './routes/roleRoute';
import adRoute from './routes/adRoute';
import notificationRoute from './routes/notificationRoute';
import customerRoute from './routes/customerRoute';
import walletRoute from './routes/walletRoute';
import transactionRoute from './routes/transactionRoute';
import reviewRoute from './routes/reviewRoute';
import reminderRoute from './routes/reminderRoute';
import dashboardRoute from './routes/dashboardRoute.';
import enquiryRoute from './routes/enquiryRoute';
import adminUserRoute from './routes/admin/usersRoute';
import { notificationReminderCron } from './controllers/notificationController';
import { shopOnOffCron } from './controllers/userController';
import fraudRoute from './routes/fraudRoute';
import { initializeFirebase } from './utils';
import adminCategoryRoute from './routes/admin/categoryRoute';

const app = express();
const server = http.createServer(app)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


server.listen(3000, () => {
    console.log('Server started at port 3000');
    initializeFirebase()
    mongoConnect();
});

app.get("/",(req:any,res:any)=>{
    res.send("Server is UP!!!")
});

app.use(userRoute);
app.use(roleRoute);
app.use(adRoute);
app.use(notificationRoute);
app.use(customerRoute);
app.use(walletRoute);
app.use(transactionRoute);
app.use(reviewRoute);
app.use(dashboardRoute);
app.use(reminderRoute);
app.use(enquiryRoute);
app.use(adminUserRoute);
app.use(fraudRoute);
app.use(adminCategoryRoute);

notificationReminderCron.stop();
shopOnOffCron.stop();

