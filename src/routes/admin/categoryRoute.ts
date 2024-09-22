import express from 'express';
import { addNewCategory, deleteCategory, listCategory, updateCategory } from '../../controllers/admin/cateogoryController';
const adminCategoryRoute = express.Router();

adminCategoryRoute.get("/api/admin/get-all-category",listCategory);
adminCategoryRoute.post("/api/admin/add-category",addNewCategory);
adminCategoryRoute.put("/api/admin/update-category",updateCategory);
adminCategoryRoute.put("/api/admin/delete-category",deleteCategory);

export default adminCategoryRoute;