import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createBookingSchema, changeBookingStatusSchema, confirmBookingSchema } from "./booking.validate.js";
import { BookingController } from "./booking.controller.js";
import { createReviewSchema } from "../review/review.validate.js";

const router = Router();

// Get all bookings (with search, filter, pagination, sorting)
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT),
    BookingController.getAllBookings,
);

// Get single booking by ID
router.get(
    "/:id",
    checkAuth(UserRole.ADMIN),
    BookingController.getBookingById,
);

// Create new booking
router.post(
    "/:id",
    checkAuth(UserRole.STUDENT),
    validateRequest(createBookingSchema),
    BookingController.createBooking,
);

// changeBookingStatus (Generic API)
router.patch(
    "/change-status/:id",
    checkAuth(UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT),
    validateRequest(changeBookingStatusSchema),
    BookingController.changeBookingStatus,
);


// hardDeleteBooking
router.delete(
    "/hard-delete-booking/:id",
    checkAuth(UserRole.ADMIN),
    BookingController.hardDeleteBooking,
);

// confirmBooking
router.patch(
    "/confirm-booking/:id",
    validateRequest(confirmBookingSchema),
    checkAuth(UserRole.TUTOR),
    BookingController.confirmBooking,
);

// Complete booking
router.patch(
    "/complete-booking/:id",
    validateRequest(createReviewSchema),
    checkAuth(UserRole.STUDENT),
    BookingController.completeBooking,
);



export const BookingRouter = router;