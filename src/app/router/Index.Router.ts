import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.router";
import { TutorRouter } from "../modules/tutor/tutor.router";
import { CategoryRouter } from "../modules/category/category.router";
import { UserRouter } from "../modules/user/user.router";
import { BookingRouter } from "../modules/booking/booking.router";
import { ReviewRouter } from "../modules/review/review.route";

const router = Router();

router.use("/auth", AuthRouter);

router.use("/tutor", TutorRouter);

router.use("/category", CategoryRouter);

router.use("/user", UserRouter);

router.use("/booking", BookingRouter);

router.use("/review", ReviewRouter);

export const IndexRouter = router;
