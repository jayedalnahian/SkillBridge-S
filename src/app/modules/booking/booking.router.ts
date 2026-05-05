import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createBookingSchema } from "./booking.validate.js";
import { BookingController } from "./booking.controller.js";

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

// cancleBooking
router.patch(
    "cancle-booking/:id",
    checkAuth(UserRole.STUDENT, UserRole.TUTOR),
    validateRequest(createBookingSchema),
    BookingController.cancleBooking,
);

// completeBooking
router.patch(
    "complete-booking/:id",
    checkAuth(UserRole.STUDENT, UserRole.TUTOR),
    validateRequest(createBookingSchema),
    BookingController.completeBooking,
);

// hardDeleteBooking
router.delete(
    "hard-delete-booking/:id",
    checkAuth(UserRole.ADMIN),
    BookingController.hardDeleteBooking,
);



export const BookingRouter = router;