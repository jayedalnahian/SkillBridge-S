import { Router } from "express";
import { CategoryController } from "./category.controller";
import { multerUpload } from "../../config/multer.config";
import { createCategorySchema } from "./category.validate";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(createCategorySchema),
  CategoryController.createCategory,
);
router.get("/", CategoryController.getAllCategories);
router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  CategoryController.deleteCategory,
);
router.post(
  "/bulk-delete",
  checkAuth(UserRole.ADMIN),
  CategoryController.bulkDeleteCategories,
);
router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(createCategorySchema),
  CategoryController.updateCategory,
);
router.patch(
  "/restore/:id",
  checkAuth(UserRole.ADMIN),
  CategoryController.restoreCategory,
);

export const CategoryRouter = router;
