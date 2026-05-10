import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { BookingService } from "./booking.service.js";
import AppError from "../../errorHalpers/AppError.js";
import { UserRole } from "../../generated/prisma/index.js";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const tutorId = req.params.id;
    if (!tutorId) {
        throw new AppError(status.BAD_REQUEST, "Tutor ID is required");
    }
    const userId = req.user?.userId;
    const result = await BookingService.createBooking({ payload, tutorId: tutorId as string, userId: userId as string });
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Booking created successfully",
        data: result,
        error: null,
    });
});

/**
 * Get all bookings with search, filter, pagination, and sorting
 */
const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const userRole = req.user?.role as UserRole;
    const userId = req.user?.userId as string;
    const result = await BookingService.getAllBookings(query, userRole, userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
        error: null,
    });
});

/**
 * Get a single booking by ID
 */
const getBookingById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BookingService.getBookingById(id as string);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Booking retrieved successfully",
        data: result,
        error: null,
    });
});


const hardDeleteBooking = catchAsync(async (req: Request, res: Response) => {
    const bookingId = req.params.id as string
    const result = await BookingService.hardDeleteBooking(bookingId)
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Booking deleted successfully",
        data: result,
        error: null,
    })
});

const changeBookingStatus = catchAsync(async (req: Request, res: Response) => {
    const bookingId = req.params.id as string;
    const { status: bookingStatus, cancelReason } = req.body;
    console.log(req, "Request from the change booking status")
    const userRole = req.user?.role as UserRole;

    const result = await BookingService.changeBookingStatus(
        bookingId,
        bookingStatus,
        userRole,
        cancelReason
    );

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: `Booking status changed to ${bookingStatus} successfully`,
        data: result,
        error: null,
    });
});

export const BookingController = {
    createBooking,
    getAllBookings,
    getBookingById,
    hardDeleteBooking,
    changeBookingStatus,
};