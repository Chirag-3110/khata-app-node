
export const loginUser=async(req:any,res:any)=>{
    try {
        res.status(200).send({response:'Connect',statusCode:200});
    } catch (error) {
        res.status(501).send({response:"Server error",status:501});
    }
}

