import { Router } from "express";
import { TutorController } from "./tutor.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../generated/prisma/index.js";

import { createTutorSchema, updateTutorSchema } from "./tutor.validate.js";
import { multerUpload } from "../../config/multer.config.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const { UserRole } = prismaPkg as any;


const router = Router();

router.get("/", TutorController.getAllTutors);
router.get("/dashboard", checkAuth(UserRole.TUTOR), TutorController.getDashboardData);
router.get("/:id", TutorController.getSingleTutor);
router.get("/:id/categories", TutorController.getAssignedCategories);
router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(createTutorSchema),
  TutorController.createTutor,
);
router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.TUTOR),
  validateRequest(updateTutorSchema),
  TutorController.updateTutor,
);

router.post(
  "/bulk-delete",
  checkAuth(UserRole.ADMIN),
  TutorController.bulkDeleteTutors,
);

router.patch(
  "/restore/:id",
  checkAuth(UserRole.ADMIN),
  TutorController.restoreTutor,
);

router.delete(
  "/permanent/:id",
  checkAuth(UserRole.ADMIN),
  TutorController.hardDeleteTutor,
);

export const TutorRouter = router;
