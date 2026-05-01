import { Router } from "express";
import { adminController } from "./admin.cointroller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../generated/prisma/index.js";

const { UserRole } = prismaPkg as any;

const router = Router();

router.get("/", checkAuth(UserRole.ADMIN), adminController.getAllAdmins);

export const AdminRouter = router;
