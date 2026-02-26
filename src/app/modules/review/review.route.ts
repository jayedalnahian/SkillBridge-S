import { Router } from "express";
import { ReviewController } from "./review.controller";

import { ReviewValidation } from "./review.validation";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../../middleware/checkAuth";
import { validateReauest } from "../../../middleware/validateRequest";

const router = Router();

router.post(
    "/",
    checkAuth(UserRole.STUDENT),
    validateReauest(ReviewValidation.createReview),
    ReviewController.createReview,
);


router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.TUTOR),
    ReviewController.getReviews,
);

export const ReviewRouter = router;