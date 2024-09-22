import { constants, roles } from "../../constants";
import { Category } from "../../models/Enquiry";
import { buildErrorResponse, buildObjectResponse, buildResponse } from "../../utils/responseUtils";

export const listCategory = async (req: any, res: any) => {
    try {
      const category = await Category.find()
      return buildObjectResponse(res, {category});
    } catch (error) {
      console.log(error, "error");
      return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
}; 

export const addNewCategory = async (req: any, res: any) => {
    try {
        const { name, description, categoryType } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return buildErrorResponse(res, constants.errors.categoryAlreadyExists, 400);
        }

        const newCategory = new Category({
            name,
            description,
            categoryType
        });

        await newCategory.save();

        return buildObjectResponse(res, { message: constants.success.categoryAdded});
    } catch (error) {
        console.log(error, "error");
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const updateCategory = async (req: any, res: any) => {
    try {
        const { name, description, categoryType,id } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return buildErrorResponse(res, constants.errors.categoryNotFound, 404);
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.categoryType = categoryType || category.categoryType;
        await category.save();

        return buildObjectResponse(res, {
            message: constants.success.categoryUpdate
        });
    } catch (error) {
        console.log(error, "error");
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};

export const deleteCategory = async (req: any, res: any) => {
    try {
        const { id } = req.query;
        const category = await Category.findById(id);
        if (!category) {
            return buildErrorResponse(res, constants.errors.categoryNotFound, 404);
        }

        await category.deleteOne();

        return buildObjectResponse(res, {
            message: constants.success.categoryDelete
        });
    } catch (error) {
        console.log(error, "error");
        return buildErrorResponse(res, constants.errors.internalServerError, 500);
    }
};
