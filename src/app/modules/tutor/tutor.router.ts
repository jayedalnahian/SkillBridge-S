import { Router } from "express";
import { TutorController } from "./tutor.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma";

import { createTutorSchema, updateTutorSchema } from "./tutor.validate";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";


const router = Router();

router.get("/", TutorController.getAllTutors);
router.get("/:id", TutorController.getSingleTutor);
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

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  TutorController.deleteTutor,
);

export const TutorRouter = router;
