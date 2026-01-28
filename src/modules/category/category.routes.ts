import { Router } from "express";
import { categoryController } from "./category.controller";
import auth, { UserRole } from "../../middlewares/auth";

export const CategoryRouter = Router()
// auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR)

CategoryRouter.get("/", categoryController.getAllCategories)
CategoryRouter.post("/admin/categories", auth(UserRole.ADMIN), categoryController.createNewCategory)
CategoryRouter.put("/admin/categories/:id", auth(UserRole.ADMIN), categoryController.updateCategory)
CategoryRouter.delete("/admin/categories/:id", auth(UserRole.ADMIN), categoryController.deleteCategory)
