import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createReviewSchema, updateReviewSchema } from "./review.validate.js";
import { ReviewController } from "./review.controller.js";

const router = Router();

// Create review (STUDENT only)
router.post(
  "/",
  checkAuth(UserRole.STUDENT),
  validateRequest(createReviewSchema),
  ReviewController.createReview,
);

// Get my reviews (STUDENT only)
router.get(
  "/my-reviews",
  checkAuth(UserRole.STUDENT),
  ReviewController.getMyReviews,
);

// Get reviews by tutor (PUBLIC - no auth required)
router.get(
  "/tutor/:tutorId",
  ReviewController.getReviewsByTutor,
);

// Update review (STUDENT only)
router.patch(
  "/:id",
  checkAuth(UserRole.STUDENT),
  validateRequest(updateReviewSchema),
  ReviewController.updateReview,
);

// Delete review (STUDENT only)
router.delete(
  "/:id",
  checkAuth(UserRole.STUDENT),
  ReviewController.deleteReview,
);

export const ReviewRouter = router;