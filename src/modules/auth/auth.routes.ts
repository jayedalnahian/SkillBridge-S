import { Router } from "express";
import { AuthController } from "./auth.controller";
import auth, { UserRole } from "../../middlewares/auth";

export const AuthRouter = Router()



AuthRouter.get("/me", auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR), AuthController.getMe)


AuthRouter.post("/logout", auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR), AuthController.logOut)