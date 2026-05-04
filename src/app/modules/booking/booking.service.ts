import { getBookingDurationInMinutes } from "../../utils/bookingDuration.js";
import calculateBookingPrice from "../../utils/calculateBookingPrice.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import status from "http-status";
import AppError from "../../errorHalpers/AppError.js";
import { IBookingCreateInput } from "./booking.type.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { bookingFilterableFields, bookingSearchableFields } from "./booking.constent.js";
import { BookingStatus, PaymentStatus, UserRole } from "../../generated/prisma/client.js";

const createBooking = async (payload: IBookingCreateInput) => {
    const { studentId, tutorId, payload: bookingData } = payload;

    // Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(status.NOT_FOUND, "Student not found");
    }

    // Validate tutor exists
    const tutor = await prisma.tutor.findUnique({
        where: { id: tutorId },
    });

    if (!tutor) {
        throw new AppError(status.NOT_FOUND, "Tutor not found");
    }

    // Calculate duration in minutes
    const durationMinutes = getBookingDurationInMinutes(
        bookingData.startDateTime,
        bookingData.endDateTime,
    );

    // Calculate price based on tutor's hourly rate
    const price = await calculateBookingPrice({
        tutorid: tutorId,
        durationMinutes,
    });

    // Create booking in database
    const booking = await prisma.booking.create({
        data: {
            studentId,
            tutorId,
            startDateTime: new Date(bookingData.startDateTime),
            endDateTime: new Date(bookingData.endDateTime),
            price,
            duration: durationMinutes,
        },
        include: {
            Student: true,
            Tutor: true,
        },
    });

    return booking;
};

const getAllBookings = async (query: IQueryParams) => {
    const bookingQuery = new QueryBuilder(prisma.booking, query, {
        searchableFields: bookingSearchableFields,
        filterableFields: bookingFilterableFields,
    })
        .search()
        .filter()
        .paginate()
        .sort()
        .fields();

    const result = await bookingQuery.execute();
    return result;
};

const getBookingById = async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            Student: true,
            Tutor: true,
            payment: true,
            reviews: true,
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    return booking;
};

const cancleBooking = async (bookingId: string, cancelBy: UserRole, cancelReason?: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    const result = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: BookingStatus.REJECTED,
            cancelBy,
            cancelReason,
        },
    });

    return result;
};


const completeBooking = async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    const result = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: BookingStatus.COMPLETED,
        },
    });

    return result;
};


const hardDeleteBooking = async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    // Rule 1: Cannot delete if current time is inside booking time range
    const now = new Date();
    if (now >= booking.startDateTime && now <= booking.endDateTime) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot delete a booking that is currently in progress"
        );
    }

    // Rule 2: Can only delete bookings with status REJECTED or COMPLETED
    if (
        booking.status !== BookingStatus.REJECTED &&
        booking.status !== BookingStatus.COMPLETED
    ) {
        throw new AppError(
            status.BAD_REQUEST,
            "Only bookings with REJECTED or COMPLETED status can be deleted"
        );
    }

    // Rule 3: Cannot delete UNPAID bookings
    if (booking.paymentStatus === PaymentStatus.UNPAID) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot delete unpaid bookings"
        );
    }

    const result = await prisma.booking.delete({
        where: { id: bookingId },
    });

    return result;
};






export const BookingService = {
    createBooking,
    getAllBookings,
    getBookingById,
    cancleBooking,
    completeBooking,
    hardDeleteBooking,
};