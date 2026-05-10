import {
  getBookingDurationInMinutes,
  validateBookingAgainstTutorAvailability,
} from "../../utils/booking.js";
import calculateBookingPrice from "../../utils/calculateBookingPrice.js";
import { prisma } from "../../lib/prisma.js";
import crypto from "crypto";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import status from "http-status";
import AppError from "../../errorHalpers/AppError.js";
import { IBookingCreateInput } from "./booking.type.js";
import { IQueryParams } from "../../interface/query.interface.js";
import {
  bookingFilterableFields,
  bookingSearchableFields,
} from "./booking.constent.js";
import {
  BookingStatus,
  DaysOfWeek,
  PaymentStatus,
  UserRole,
  Tutor,
} from "../../generated/prisma/client.js";
import { stripe } from "../../config/stripe.config.js";
import { envVars } from "../../config/env.js";

const createBooking = async (payload: IBookingCreateInput) => {
  const { userId, tutorId, payload: bookingData } = payload;

  // Validate student exists
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  // Validate tutor exists and is not deleted
  const tutor = await prisma.tutor.findUnique({
    where: { id: tutorId, isDeleted: false },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found or has been deleted");
  }

  // Validate booking is within tutor's availability
  validateBookingAgainstTutorAvailability(
    new Date(bookingData.startDateTime),
    new Date(bookingData.endDateTime),
    tutor,
  );

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

  // Create booking, payment, and Stripe session in a transaction
  const result = await prisma.$transaction(async (tx: typeof prisma) => {
    const newBooking = await tx.booking.create({
      data: {
        studentId: student.id,
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

    // Create associated payment record
    const payment = await tx.payment.create({
      data: {
        amount: price,
        transactionId: crypto.randomUUID(),
        bookingId: newBooking.id,
        status: PaymentStatus.UNPAID,
      },
    });

    // Create Stripe Checkout Session immediately
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tutoring Session with ${tutor.name || "Tutor"}`,
              description: `Booking ID: ${newBooking.id}\nDate: ${newBooking.startDateTime.toISOString()}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: newBooking.id,
        paymentId: payment.id,
      },
      success_url: `${envVars.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${envVars.FRONTEND_URL}/payment/cancel?booking_id=${newBooking.id}`,
    });

    return {
      booking: newBooking,
      payment,
      paymentUrl: session.url,
    };
  });

  return {
    booking: result.booking,
    payment: result.payment,
    paymentUrl: result.paymentUrl,
  };
};

const getAllBookings = async (
  query: IQueryParams,
  userRole: UserRole,
  userId: string,
) => {
  // Initialize filter if not exists
  if (!query.filter) {
    query.filter = {};
  }

  // Apply role-based filtering
  if (userRole === UserRole.STUDENT) {
    // Look up student by userId and filter by studentId
    const student = await prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new AppError(status.NOT_FOUND, "Student not found");
    }
    query.filter.studentId = student.id;
  }

  if (userRole === UserRole.TUTOR) {
    // Look up tutor by userId and filter by tutorId
    const tutor = await prisma.tutor.findUnique({
      where: { userId },
    });
    if (!tutor) {
      throw new AppError(status.NOT_FOUND, "Tutor not found");
    }
    query.filter.tutorId = tutor.id;
  }

  // Admin sees all bookings (no additional filter)

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
      "Cannot delete a booking that is currently in progress",
    );
  }

  // Rule 2: Can only delete bookings with status REJECTED or COMPLETED
  if (
    booking.status !== BookingStatus.REJECTED &&
    booking.status !== BookingStatus.COMPLETED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Only bookings with REJECTED or COMPLETED status can be deleted",
    );
  }

  // Rule 3: Cannot delete UNPAID bookings
  if (booking.paymentStatus === PaymentStatus.UNPAID) {
    throw new AppError(status.BAD_REQUEST, "Cannot delete unpaid bookings");
  }

  const result = await prisma.booking.delete({
    where: { id: bookingId },
  });

  return result;
};

const changeBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  cancelBy?: UserRole,
  cancelReason?: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, "Booking not found");
  }

  const updateData: any = { status };

  if (status === BookingStatus.REJECTED) {
    updateData.cancelBy = cancelBy;
    updateData.cancelReason = cancelReason;
  }

  const result = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });

  return result;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getBookingById,
  hardDeleteBooking,
  changeBookingStatus,
};
