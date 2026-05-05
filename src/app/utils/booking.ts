import { differenceInMinutes, isBefore, isEqual } from "date-fns";
import AppError from "../errorHalpers/AppError.js";
import status from "http-status";
import { DaysOfWeek, Tutor } from "../generated/prisma/index.js";

/**
 * Options for configuring the duration calculation behavior.
 */
export interface CalculateDurationOptions {

  strict?: boolean;
  minDuration?: number;
}


export interface DurationResult {
  minutes: number;
  wholeMinutes: number;
  hours: number;
  isValid: boolean;
}

export class InvalidBookingDurationError extends Error {
  constructor(
    message: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
  ) {
    super(message);
    this.name = "InvalidBookingDurationError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidBookingDurationError);
    }
  }
}



const parseDateTime = (input: Date | string): Date => {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new TypeError("Invalid Date object provided");
    }
    return input;
  }

  if (typeof input === "string") {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid date string provided: "${input}"`);
    }
    return parsed;
  }

  throw new TypeError(
    `Expected Date or string, received ${typeof input}`,
  );
};

export const calculateBookingDuration = (
  startDateTime: Date | string,
  endDateTime: Date | string,
  options: CalculateDurationOptions = {},
): DurationResult => {
  const { strict = true, minDuration = 0 } = options;

  // Parse inputs to Date objects
  const start = parseDateTime(startDateTime);
  const end = parseDateTime(endDateTime);

  // Validate chronological order
  if (strict) {
    if (isBefore(end, start) || isEqual(end, start)) {
      throw new InvalidBookingDurationError(
        `Invalid booking duration: end time (${end.toISOString()}) must be after start time (${start.toISOString()}). ` +
          `Current difference would be ${differenceInMinutes(start, end)} minutes (negative or zero).`,
        start,
        end,
      );
    }
  }

  // Calculate duration in minutes
  const wholeMinutes = differenceInMinutes(end, start);

  // For more precision, calculate including seconds/milliseconds
  const startMs = start.getTime();
  const endMs = end.getTime();
  const durationMs = endMs - startMs;
  const minutes = durationMs / (1000 * 60);

  // Validate minimum duration
  const isValid = minutes > 0 && minutes >= minDuration;

  return {
    minutes: Math.round(minutes * 100) / 100, // Round to 2 decimal places
    wholeMinutes: Math.max(0, wholeMinutes),
    hours: Math.round((minutes / 60) * 100) / 100,
    isValid,
  };
};

export const getBookingDurationInMinutes = (
  startDateTime: Date | string,
  endDateTime: Date | string,
): number => {
  return calculateBookingDuration(startDateTime, endDateTime).minutes;
};







/**
 * Maps JavaScript day number (0-6) to DaysOfWeek enum
 */
export const getDayOfWeekFromDate = (date: Date): DaysOfWeek => {
    const daysMap: Record<number, DaysOfWeek> = {
        0: DaysOfWeek.SUNDAY,
        1: DaysOfWeek.MONDAY,
        2: DaysOfWeek.TUESDAY,
        3: DaysOfWeek.WEDNESDAY,
        4: DaysOfWeek.THURSDAY,
        5: DaysOfWeek.FRIDAY,
        6: DaysOfWeek.SATURDAY,
    };
    return daysMap[date.getUTCDay()];
};

/**
 * Extracts time in HH:mm format from a Date
 */
export const getTimeString = (date: Date): string => {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
};

/**
 * Validates that a booking time falls within the tutor's availability window
 */
export const validateBookingAgainstTutorAvailability = (
    bookingStart: Date,
    bookingEnd: Date,
    tutor: Tutor,
): void => {
    // 1. Validate day of week
    const bookingDay = getDayOfWeekFromDate(bookingStart);
    if (!tutor.availableDays.includes(bookingDay)) {
        throw new AppError(
            status.BAD_REQUEST,
            `Tutor is not available on ${bookingDay}. Available days: ${tutor.availableDays.join(", ")}`,
        );
    }

    // 2. Validate time window (strict containment)
    const bookingStartTime = getTimeString(bookingStart);
    const bookingEndTime = getTimeString(bookingEnd);
    const tutorStartTime = getTimeString(tutor.availabilityStartTime);
    const tutorEndTime = getTimeString(tutor.availabilityEndTime);

    if (bookingStartTime < tutorStartTime || bookingEndTime > tutorEndTime) {
        throw new AppError(
            status.BAD_REQUEST,
            `Booking time must be between ${tutorStartTime} and ${tutorEndTime}`,
        );
    }
};
