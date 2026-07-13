import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.router.js";
import { TutorRouter } from "../modules/tutor/tutor.router.js";
import { CategoryRouter } from "../modules/category/category.router.js";
import { StudentRouter } from "../modules/student/student.router.js";
import { AdminRouter } from "../modules/admin/admin.router.js";
import { BookingRouter } from "../modules/booking/booking.router.js";
import { PaymentRouter } from "../modules/payment/payment.router.js";
import { ReviewRouter } from "../modules/review/review.router.js";
import { statsRoute } from "../modules/stats/stats.route.js";
import { MessageRouter } from "../modules/message/message.router.js";

const router = Router();

router.use("/auth", AuthRouter);

router.use("/tutor", TutorRouter);

router.use("/category", CategoryRouter);

router.use("/student", StudentRouter);

router.use("/admin", AdminRouter);

router.use("/booking", BookingRouter);

router.use("/payment", PaymentRouter);

router.use("/review", ReviewRouter);

router.use("/stats", statsRoute);

router.use("/message", MessageRouter);

export const IndexRouter = router;
