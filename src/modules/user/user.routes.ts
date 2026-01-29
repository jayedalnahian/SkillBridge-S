import { Router } from "express";
import { userController } from "./user.controller";
import auth, { UserRole } from "../../middlewares/auth";
export const UserRouter = Router()



UserRouter.get("/admin/users", auth(UserRole.ADMIN), userController.getAllUser)
UserRouter.patch("/admin/users/:id/status", auth(UserRole.ADMIN), userController.updateUserStatus)
UserRouter.get("/student/dashboard", auth(UserRole.STUDENT), userController.getStudentDashboardController)