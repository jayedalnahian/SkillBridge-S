import status from "http-status";
import { prisma } from "../../lib/prisma";
import { IBookingQueryParams, ICreateBookingPayload } from "./booking.type";
import { IRequestUser } from "../../interface/requestUser.interface";
import { DaysOfWeek } from "../../generated/prisma";
import {
  BOOKING_DEFAULT_INCLUDES,
  BOOKING_FILTERABLE_FIELDS,
  BOOKING_INCLUDE_CONFIG,
  BOOKING_SEARCHABLE_FIELDS,
} from "./booking.constant";
import { QueryBuilder } from "../../utils/QueryBuilder";
import AppError from "../../errorHalpers/AppError";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES: DaysOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const MAX_BOOKING_HOURS = 24;
const MIN_BOOKING_MINUTES = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns total minutes since midnight (UTC) from a Date object.
 */
const toUTCMinutes = (date: Date): number =>
  date.getUTCHours() * 60 + date.getUTCMinutes();

/**
 * Returns UTC day name from a Date object.
 */
const getUTCDayName = (date: Date): DaysOfWeek => DAY_NAMES[date.getUTCDay()];

/**
 * Checks whether a booking time range [bookStart, bookEnd) (in minutes)
 * fits within a tutor availability window [availStart, availEnd) (in minutes).
 *
 * Handles four scenarios:
 *   1. Same-day tutor window, same-day booking
 *   2. Same-day tutor window, booking crosses midnight   → always invalid
 *   3. Overnight tutor window, same-day booking          → must fit in one contiguous half
 *   4. Overnight tutor window, booking crosses midnight  → must fit within overnight span
 */
const isWithinAvailability = (
  bookStart: number,
  bookEnd: number,
  availStart: number,
  availEnd: number,
): boolean => {
  const bookingCrossesMidnight = bookEnd < bookStart;
  const tutorCrossesMidnight = availEnd < availStart;

  if (!tutorCrossesMidnight && !bookingCrossesMidnight) {
    // ① Both same-day — straightforward range check
    return bookStart >= availStart && bookEnd <= availEnd;
  }

  if (!tutorCrossesMidnight && bookingCrossesMidnight) {
    // ② Tutor is same-day but booking wraps midnight — impossible to fit
    return false;
  }

  if (tutorCrossesMidnight && !bookingCrossesMidnight) {
    // ③ Tutor window is overnight, booking is same-day
    // Must fit entirely within the evening portion [availStart → midnight)
    // OR entirely within the morning portion [midnight → availEnd)
    const inEveningSlot = bookStart >= availStart && bookEnd >= availStart;
    const inMorningSlot = bookStart <= availEnd && bookEnd <= availEnd;
    return inEveningSlot || inMorningSlot;
  }

  // ④ Both cross midnight — booking must fit within the overnight window
  return bookStart >= availStart && bookEnd <= availEnd;
};

// ─── Service ──────────────────────────────────────────────────────────────────

const createBooking = async (
  user: IRequestUser,
  payload: ICreateBookingPayload,
) => {
  const { tutorId, startDateTime, endDateTime, meetingLink } = payload;
  const studentId = user.userId;

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  // ── 1. Validate datetime inputs ──────────────────────────────────────────

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError(
      status.BAD_REQUEST,
      "Invalid startDateTime or endDateTime",
    );
  }

  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  const durationHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(4));

  if (durationMinutes < MIN_BOOKING_MINUTES) {
    throw new AppError(
      status.BAD_REQUEST,
      `Booking duration must be at least ${MIN_BOOKING_MINUTES} minutes`,
    );
  }

  if (durationHours > MAX_BOOKING_HOURS) {
    throw new AppError(
      status.BAD_REQUEST,
      `Booking duration cannot exceed ${MAX_BOOKING_HOURS} hours`,
    );
  }

  if (start < new Date()) {
    throw new AppError(
      status.BAD_REQUEST,
      "Booking cannot be scheduled in the past",
    );
  }

  // ── 2. Verify student exists and is not deleted ──────────────────────────

  const student = await prisma.user.findUnique({
    where: { id: studentId, isDeleted: false },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student account not found");
  }

  // ── 3. Verify tutor exists and is active ─────────────────────────────────

  const tutor = await prisma.tutor.findUnique({
    where: { id: tutorId, isDeleted: false },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found");
  }

  if (tutor.status !== "ACTIVE") {
    throw new AppError(
      status.BAD_REQUEST,
      "Tutor is not currently accepting bookings",
    );
  }

  // ── 4. Validate booking day(s) against tutor's availableDays ────────────

  const startDay = getUTCDayName(start);
  const endDay = getUTCDayName(end);

  if (!tutor.availableDays.includes(startDay)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Tutor is not available on ${startDay}`,
    );
  }

  // If the booking crosses into the next UTC day, that day must also be available
  const bookingCrossesMidnight = toUTCMinutes(end) < toUTCMinutes(start);
  if (bookingCrossesMidnight && startDay !== endDay) {
    if (!tutor.availableDays.includes(endDay)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Tutor is not available on ${endDay} (booking crosses midnight UTC)`,
      );
    }
  }

  // ── 5. Validate booking time against tutor's availability window ─────────

  const bookStartMinutes = toUTCMinutes(start);
  const bookEndMinutes = toUTCMinutes(end);

  const tutorAvailStart = new Date(tutor.availabilityStartTime);
  const tutorAvailEnd = new Date(tutor.availabilityEndTime);

  const tutorStartMinutes = toUTCMinutes(tutorAvailStart);
  const tutorEndMinutes = toUTCMinutes(tutorAvailEnd);

  const withinWindow = isWithinAvailability(
    bookStartMinutes,
    bookEndMinutes,
    tutorStartMinutes,
    tutorEndMinutes,
  );

  if (!withinWindow) {
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")} UTC`;

    throw new AppError(
      status.BAD_REQUEST,
      `Booking time (${fmt(bookStartMinutes)} – ${fmt(bookEndMinutes)}) is outside Tutor's available hours (${fmt(tutorStartMinutes)} – ${fmt(tutorEndMinutes)})`,
    );
  }

  // ── 6. Check for scheduling conflicts (tutor and student) ────────────────

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      isDeleted: false,
      status: { in: ["PENDING", "ACCEPTED"] },
      OR: [{ tutorId }, { userId: studentId }],
      AND: [{ startDateTime: { lt: end } }, { endDateTime: { gt: start } }],
    },
    select: { id: true, userId: true, tutorId: true },
  });

  if (conflictingBooking) {
    const isStudentConflict = conflictingBooking.userId === studentId;
    throw new AppError(
      status.CONFLICT,
      isStudentConflict
        ? "You already have a booking that overlaps with this time slot"
        : "Tutor already has a booking that overlaps with this time slot",
    );
  }

  // ── 7. Create the booking ────────────────────────────────────────────────

  const totalPrice = parseFloat((durationHours * tutor.hourlyRate).toFixed(2));

  const booking = await prisma.booking.create({
    data: {
      userId: studentId,
      tutorId,
      startDateTime: start,
      endDateTime: end,
      price: totalPrice,
      duration: durationHours,
      meetingLink,
    },
    include: {
      Tutor: true,
      User: true,
    },
  });

  return booking;
};

const getBookings = async (
  user: IRequestUser,
  queryParams: IBookingQueryParams,
) => {
  const isStudent = user.role === "STUDENT";
  const isTutor = user.role === "TUTOR";

  // Fetch tutorId from the Tutor table if the user is a tutor
  // because IRequestUser carries userId (the User table FK), not the Tutor row id
  let tutorRowId: string | undefined;
  if (isTutor) {
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.userId, isDeleted: false },
      select: { id: true },
    });

    if (!tutor) {
      throw new AppError(status.NOT_FOUND, "Tutor profile not found");
    }

    tutorRowId = tutor.id;
  }

  // Base condition — role-scoped, cannot be overridden by query params
  const baseCondition: Record<string, unknown> = {
    isDeleted: false,
    ...(isStudent && { userId: user.userId }),
    ...(isTutor && { tutorId: tutorRowId }),
  };

  // Strip the filter keys that each role must not be allowed to override
  const allowedFilterableFields = BOOKING_FILTERABLE_FIELDS.filter((f) => {
    if (isStudent && f === "userId") return false; // student can't spoof another user
    if (isTutor && f === "tutorId") return false; // tutor can't spoof another tutor
    return true;
  });

  const result = await new QueryBuilder(prisma.booking, queryParams, {
    searchableFields: BOOKING_SEARCHABLE_FIELDS,
    filterableFields: allowedFilterableFields,
  })
    .where(baseCondition)
    .search()
    .filter()
    .sort()
    .paginate()
    .dynamicInclude(BOOKING_INCLUDE_CONFIG, [...BOOKING_DEFAULT_INCLUDES])
    .execute();

  return result;
};

// ─── Get Booking By ID ────────────────────────────────────────────────────────

const getBookingById = async (user: IRequestUser, bookingId: string) => {
  const isStudent = user.role === "STUDENT";
  const isTutor = user.role === "TUTOR";

  let tutorRowId: string | undefined;
  if (isTutor) {
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.userId, isDeleted: false },
      select: { id: true },
    });

    if (!tutor) {
      throw new AppError(status.NOT_FOUND, "Tutor profile not found");
    }

    tutorRowId = tutor.id;
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      isDeleted: false,
      ...(isStudent && { userId: user.userId }),
      ...(isTutor && { tutorId: tutorRowId }),
    },
    include: {
      Tutor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          designation: true,
          hourlyRate: true,
          availableDays: true,
          availabilityStartTime: true,
          availabilityEndTime: true,
        },
      },
      User: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      reviews: {
        where: { isDeleted: false },
      },
    },
  });

  if (!booking) {
    const isDenied = isStudent || isTutor;
    throw new AppError(
      status.NOT_FOUND,
      isDenied ? "Booking not found or access denied" : "Booking not found",
    );
  }

  return booking;
};

export const BookingService = {
  createBooking,
  getBookings,
  getBookingById,
};
