import { Router } from "express";
import { BookingController } from "./booking.controller";
import { checkAuth } from "../../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateReauest } from "../../../middleware/validateRequest";
import { BookingValidation } from "./booking.validate";

const router = Router();

router.post(
    "/create-booking",
    checkAuth(UserRole.STUDENT),
    validateReauest(BookingValidation.createBookingSchema),
    BookingController.createBooking
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
