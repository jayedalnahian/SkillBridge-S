import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { reviewController } from "./review.collection";

export const ReviewRouter = Router()

ReviewRouter.post("/", auth(UserRole.STUDENT), reviewController.createReviewController)
ReviewRouter.get("/:tutorId/reviews", reviewController.getTutorReviewsController)
ReviewRouter.put("/:id/response", reviewController.replyToReviewController)