import User from "../models/user";
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'chirag_chat_app';


export const addNewUser = async (req:any,res:any) => {
    try {
        const {name,email,password} = req.body;

        const user=await User.findOne({email:email});

        if(user)
            res.status(401).send({resonse:"Email already exists",statusCode:401});
        else{
            const userData={
                name:name,
                email:email,
                password:password,
            }
            const userRes = new User(userData);
    
            const respone = await userRes.save();
    
            res.status(200).send({response:respone,statusCode:200});
        }

    } catch (error) {
        console.log(error,"eror");
        res.status(500).send({error:"Server error"})
    }
}

export const loginUser=async(req:any,res:any)=>{
    try {
        const {email,pass}=req.body;
        console.log(email,pass);
        
        const user=await User.findOne({email:email,password:pass});
        
        if(!user)
            res.status(401).send({response:"User not found",statusCode:401});
        else{
            const token = jwt.sign({ userId: user.id }, JWT_SECRET);
            res.status(200).send({response:{token:token,userId:user?._id},statusCode:200});
        }
    } catch (error) {
        res.status(501).send({response:"Server error",status:501});
    }
}

export const getUserProfile=async(req:any,res:any)=>{
    try {
        const {userId}=req.user;
        console.log(userId);
        
        const user=await User.findById(userId);
        
        if(!user)
            res.status(401).send({response:"User not found",statusCode:401});
        else{
            res.status(200).send({response:{user},statusCode:200});
        }
    } catch (error) {
        res.status(501).send({response:"Server error",status:501});
    }
}

