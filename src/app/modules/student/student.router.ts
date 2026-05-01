import { Router } from "express";
import { StudentController } from "./student.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateStudentSchema } from "./student.validation.js";

const router = Router();

router.get("/", checkAuth(UserRole.ADMIN), StudentController.getAllStudents);
router.get("/:id", checkAuth(UserRole.ADMIN), StudentController.getStudentById);
router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.STUDENT),
  validateRequest(updateStudentSchema),
  StudentController.updateStudent,
);
router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.STUDENT),
  StudentController.softDeleteStudent,
);
router.post(
  "/bulk-delete",
  checkAuth(UserRole.ADMIN),
  StudentController.bulkSoftDeleteStudents,
);
router.delete(
  "/permanent/:id",
  checkAuth(UserRole.ADMIN),
  StudentController.hardDeleteStudent,
);
router.patch(
  "/restore/:id",
  checkAuth(UserRole.ADMIN),
  StudentController.restoreStudent,
);

export const StudentRouter = router;
