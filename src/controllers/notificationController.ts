
import { constants } from "../constants";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../utils/responseUtils";

export const triggerNotification=async(req:any,res:any)=>{
    try {
        res.status(200).send({response:'Connect',statusCode:200});
    } catch (error) {
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}
