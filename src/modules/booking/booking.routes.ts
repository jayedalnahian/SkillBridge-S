import { Router } from "express"
import auth, { UserRole } from "../../middlewares/auth"
import { bookingController } from "./booking.controller"

export const BookingRouter = Router()


BookingRouter.post("/:id/approve", auth(UserRole.STUDENT), bookingController.createBookingController)
BookingRouter.get("/", auth(UserRole.STUDENT, UserRole.TUTOR), bookingController.getUserBookingsController)
BookingRouter.get("/:id", auth(UserRole.STUDENT, UserRole.TUTOR), bookingController.getBookingByIdController)
BookingRouter.patch(":id/cancel", auth(UserRole.STUDENT, UserRole.TUTOR), bookingController.cancelBookingController)
