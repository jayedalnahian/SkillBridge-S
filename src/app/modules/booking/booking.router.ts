import { Router } from "express";
import { BookingController } from "./booking.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma";

import { BookingValidation } from "./booking.validate";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/create-booking",
  checkAuth(UserRole.STUDENT),
  validateRequest(BookingValidation.createBookingSchema),
  BookingController.createBooking,
);

router.get(
  "/",
  checkAuth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR),
  BookingController.getBookings,
);

router.get(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR),
  BookingController.getBookingById,
);

export const BookingRouter = router;
