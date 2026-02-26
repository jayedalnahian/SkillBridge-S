import status from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { BookingService } from "./booking.service";
import { IRequestUser } from "../../interface/requestUser.interface";
import { IBookingQueryParams } from "./booking.type";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await BookingService.createBooking(user, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "Booking created successfully",
        data: result,
        error: null,
    });
});

const getBookings = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const query = req.query as IBookingQueryParams;
    const result = await BookingService.getBookings(user, query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Bookings fetched successfully",
        data: result,
        error: null,
    });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await BookingService.getBookingById(user, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Booking fetched successfully",
        data: result,
        error: null,
    });
});

export const BookingController = {
    createBooking,
    getBookings,
    getBookingById,
};
