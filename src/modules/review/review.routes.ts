import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { reviewController } from "./review.collection";

export const ReviewRouter = Router()

ReviewRouter.post("/", auth(UserRole.STUDENT), reviewController.createReviewController)
ReviewRouter.post("/:tutorId/reviews", reviewController.getTutorReviewsController)