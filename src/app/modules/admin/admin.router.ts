import { Router } from "express";
import { adminController } from "./admin.cointroller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../generated/prisma/index.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createAdminSchema, updateAdminSchema } from "./admin.validation.js";

const { UserRole } = prismaPkg as any;

const router = Router();

router.get(
    "/",
    checkAuth(UserRole.ADMIN),
    adminController.getAllAdmins
);

router.get(
    "/:id",
    checkAuth(UserRole.ADMIN),
    adminController.getSingleAdmin
);

router.post(
    "/",
    checkAuth(UserRole.ADMIN),
    validateRequest(createAdminSchema),
    adminController.createAdmin,
);

router.patch(
    "/:id",
    checkAuth(UserRole.ADMIN),
    validateRequest(updateAdminSchema),
    adminController.updateAdmin,
);

router.delete(
    "/permanent/:id",
    checkAuth(UserRole.ADMIN),
    adminController.hardDeleteAdmin,
);

export const AdminRouter = router;
