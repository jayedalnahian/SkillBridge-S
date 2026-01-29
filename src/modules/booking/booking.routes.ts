import { Router } from "express"
import auth, { UserRole } from "../../middlewares/auth"
import { bookingController } from "./booking.controller"

export const BookingRouter = Router()


BookingRouter.patch("/:id/approve", auth(UserRole.ADMIN), bookingController.createBookingController)