import { Router } from "express";
import prismaPkg from "../../generated/prisma/index.js";
import { CategoryController } from "./category.controller.js";
// import { multerUpload } from "../../config/multer.config.js";
import { createCategorySchema } from "./category.validate.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const { UserRole } = prismaPkg as any;

const router = Router();

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(createCategorySchema),
  CategoryController.createCategory,
);
router.get("/", CategoryController.getAllCategories);
router.get("/used-by-tutors", CategoryController.getCategoriesUsedByTutors);
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
