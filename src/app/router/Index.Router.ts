import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.router.js";
import { TutorRouter } from "../modules/tutor/tutor.router.js";
import { CategoryRouter } from "../modules/category/category.router.js";



const router = Router();

router.use("/auth", AuthRouter);

router.use("/tutor", TutorRouter);

router.use("/category", CategoryRouter);




export const IndexRouter = router;
