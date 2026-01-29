import { Router } from "express"
import auth, { UserRole } from "../../middlewares/auth"
import { bookingController } from "./booking.controller"

export const BookingRouter = Router()


BookingRouter.post("/:id/approve", auth(UserRole.STUDENT), bookingController.createBookingController)