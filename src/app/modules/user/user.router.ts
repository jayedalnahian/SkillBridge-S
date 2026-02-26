import { Router } from "express";
import { UserController } from "./user.controller";
import { checkAuth } from "../../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router()


router.get("/", checkAuth(UserRole.ADMIN), UserController.getAllUsers)
router.patch("/:id", checkAuth(UserRole.ADMIN), UserController.updateUserStatus)
router.delete("/:id", checkAuth(UserRole.ADMIN), UserController.deleteUser)



export const UserRouter = router