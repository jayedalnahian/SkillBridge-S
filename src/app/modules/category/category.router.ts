import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router()

router.post('/', CategoryController.createCategory)



export const CategoryRouter = router