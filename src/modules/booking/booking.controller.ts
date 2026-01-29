import { Request, Response } from "express"
import { CreateBookingInput } from "./booking.types"
import { bookingService } from './booking.service';
import { BookingStatus } from "../../../generated/prisma/enums";

const createBookingController = async (req: Request, res: Response) => {
    try {
        const studentId = req.user?.userProfileId
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "No studentId found",
            })
        }

        const payload: CreateBookingInput = {
            studentId,
            tutorProfileId: req.body.tutorProfileId,
            availabilityId: req.body.availabilityId,
            startDateTime: new Date(req.body.startDateTime),
            endDateTime: new Date(req.body.endDateTime),
            duration: Number(req.body.duration),
            studentNotes: req.body.studentNotes,
            meetingType: req.body.meetingType,
        }

        const booking = await bookingService.createBooking(payload)

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}

const getUserBookingsController = async (req: Request, res: Response) => {
    try {
        const userProfileId = req.user?.userProfileId
        const role = req.user?.role

        if (!userProfileId || !role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Missing user information",
            })
        }

        // Get status from query and validate
        const statusQuery = req.query.status
        let status: BookingStatus | undefined
        if (typeof statusQuery === "string") {
            if (Object.values(BookingStatus).includes(statusQuery as BookingStatus)) {
                status = statusQuery as BookingStatus
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking status",
                    data: null,
                    error: null,
                })
            }
        }

        const bookings = await bookingService.getUserBookings({
            userProfileId,
            role,
            status,
        })

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: bookings,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}



const getBookingByIdController = async (req: Request, res: Response) => {
    try {
        const Id = req.params.id || ""
        const bookingId = typeof (Id) === "string" ? Id : ""
        const userProfileId = req.user?.userProfileId
        const role = req.user?.role

        if (!userProfileId || !role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Missing user information",
            })
        }

        const booking = await bookingService.getBookingById({ bookingId, userProfileId, role })

        res.status(200).json({
            success: true,
            message: "Booking retrieved successfully",
            data: booking,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}



const cancelBookingController = async (req: Request, res: Response) => {
    try {
        const bookingId = typeof (req.params.id) === "string" ? req.params.id : ""
        const userProfileId = req.user?.userProfileId
        const role = req.user?.role
        const reason = typeof req.body.reason === "string" ? req.body.reason : undefined

        if (!userProfileId || !role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Missing user information",
            })
        }

        const cancelledBooking = await bookingService.cancelBooking({
            bookingId,
            userProfileId,
            role,
            reason,
        })

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: cancelledBooking,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}
const completeBookingController = async (req: Request, res: Response) => {
    try {
        const bookingId = typeof (req.params.id) === "string" ? req.params.id : ""
        const userProfileId = req.user?.userProfileId
        const role = req.user?.role

        if (!userProfileId || !role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Missing user information",
            })
        }

        const completedBooking = await bookingService.completeBooking({
            bookingId,
            userProfileId,
            role,
        })

        res.status(200).json({
            success: true,
            message: "Booking marked as completed",
            data: completedBooking,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}

export const bookingController = { completeBookingController, cancelBookingController,createBookingController, getBookingByIdController, getUserBookingsController }