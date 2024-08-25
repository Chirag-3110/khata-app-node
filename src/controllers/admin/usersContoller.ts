import { constants, roles } from "../../constants";
import Role from "../../models/Role";
import Shop from "../../models/Shop";
import User from "../../models/user";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../../utils/responseUtils";

// export const updatedShopStatus=async(req:any,res:any) => {
//     const {userId}=req.user;
//     try {
//         if (!userId)
//             return buildErrorResponse(res, constants.errors.invalidUserId, 404);
    
//         const findUser = await User.findById(userId);
    
//         if (!findUser)
//             return buildErrorResponse(res, constants.errors.userNotFound, 404);

//         const checkForRole=await Role.findById(findUser?.role)

//         if(checkForRole?.role === roles.Customer)
//             return buildErrorResponse(res, constants.errors.userNotVender, 401);

//         const userShop=await Shop.findById(findUser?.shopId)

//         if(!userShop)
//             return buildErrorResponse(res, constants.errors.shopNotFound, 401);

//         // console.log(userShop,'Shop');

//         await Shop.findByIdAndUpdate(
//             userShop?._id,
//             {
//               status: !userShop?.status 
//             },
//             { new: true }
//         )

//         return buildResponse(res, constants.success.shopStatusChanged, 200);
//     } catch (error) {
//         console.log(error, 'error');
//         return buildErrorResponse(res, constants.errors.internalServerError, 500);
//     }
// }

// export const updateUserStatus=async(req:any,res:any) => {
//     const {userId}=req.params;
//     try {
//         if (!userId)
//             return buildErrorResponse(res, constants.errors.invalidUserId, 404);
    
//         const findUser = await User.findById(userId);
    
//         if (!findUser)
//             return buildErrorResponse(res, constants.errors.userNotFound, 404);

//         await User.findByIdAndUpdate(
//             userId,
//             {
//                 activeStatus: !findUser?.activeStatus 
//             },
//             { new: true }
//         )

//         const userShop=await Shop.findById(findUser?.shopId)

//         if(userShop){
//             await Shop.findByIdAndUpdate(
//                 userShop?._id,
//                 {
//                   status: !userShop?.status 
//                 },
//                 { new: true }
//             )
//         }

//         return buildResponse(res, findUser?.activeStatus?constants.success.userDeactivated:constants.success.userActivated, 200);

//     } catch (error) {
//         console.log(error, 'error');
//         return buildErrorResponse(res, constants.errors.internalServerError, 500);
//     }
// }

export const listAllCustomers = async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const role=await Role.findOne({role:roles.Customer});
  
      const customers = await User.find({role:role?._id})
  
      return buildObjectResponse(res, {
        customers,
      });
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const listAllVenders = async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const role=await Role.findOne({role:roles.Vender});
  
      const customers = await User.find({role:role?._id})
        .populate("shopId")
  
      return buildObjectResponse(res, {
        customers,
      });
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};