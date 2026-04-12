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
  multerUpload.single("file"),
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
router.patch(
  "/:id",
  multerUpload.single("file"),
  checkAuth(UserRole.ADMIN),
  validateRequest(createCategorySchema),
  CategoryController.updateCategory,
);

export const CategoryRouter = router;
