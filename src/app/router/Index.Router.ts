import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.router";
import { TutorRouter } from "../modules/tutor/tutor.router";
import { CategoryRouter } from "../modules/category/category.router";

const router = Router()

router.use(
    "/auth",
    AuthRouter
)


router.use(
    "/tutor",
    TutorRouter
)


router.use(
    "/category",
    CategoryRouter
)


export const IndexRouter = router;