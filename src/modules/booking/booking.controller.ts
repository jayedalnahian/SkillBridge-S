import { Request, Response } from "express"
import { CreateBookingInput } from "./booking.types"
import { bookingService } from './booking.service';

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

        const status = typeof req.query.status === "string" ? req.query.status : "ACTIVE"

        const bookings = await bookingService.getUserBookings({ userProfileId, role, status })

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


export const bookingController = { createBookingController, getUserBookingsController }