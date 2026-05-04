import { differenceInMinutes, isBefore, isEqual } from "date-fns";

/**
 * Options for configuring the duration calculation behavior.
 */
export interface CalculateDurationOptions {
  /**
   * Whether to throw an error when end time is before or equal to start time.
   * @default true
   */
  strict?: boolean;
  /**
   * Minimum allowed duration in minutes.
   * @default 0
   */
  minDuration?: number;
}

/**
 * Result of the duration calculation.
 */
export interface DurationResult {
  /** Duration in minutes (can have decimals for partial minutes) */
  minutes: number;
  /** Duration in whole minutes (rounded down) */
  wholeMinutes: number;
  /** Duration in hours with decimal precision */
  hours: number;
  /** Whether the duration is valid (positive and meets minimum requirements) */
  isValid: boolean;
}

/**
 * Custom error class for invalid booking duration scenarios.
 */
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

/**
 * Parses input into a Date object.
 * Handles both Date objects and ISO date strings.
 *
 * @param input - Date object or ISO date string
 * @returns Parsed Date object
 * @throws {TypeError} If input is not a valid Date or ISO string
 */
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

/**
 * Calculates the booking duration between two DateTimes in minutes.
 *
 * This function computes the time difference between a start and end datetime,
 * returning the duration in minutes. It includes validation to ensure the
 * end time is after the start time, and can be configured with various options.
 *
 * @param startDateTime - The booking start time (Date or ISO string)
 * @param endDateTime - The booking end time (Date or ISO string)
 * @param options - Configuration options for the calculation
 * @returns DurationResult object containing minutes, hours, and validity info
 * @throws {InvalidBookingDurationError} If end time is before or equal to start time (when strict mode is enabled)
 * @throws {TypeError} If inputs are not valid Date objects or ISO strings
 *
 * @example
 * ```typescript
 * // Standard 60-minute booking
 * const result = calculateBookingDuration(
 *   "2024-01-15T10:00:00Z",
 *   "2024-01-15T11:00:00Z"
 * );
 * // result.minutes === 60
 * ```
 *
 * @example
 * ```typescript
 * // Booking spanning midnight
 * const result = calculateBookingDuration(
 *   "2024-01-15T23:30:00Z",
 *   "2024-01-16T01:15:00Z"
 * );
 * // result.minutes === 105
 * ```
 *
 * @example
 * ```typescript
 * // With Date objects
 * const result = calculateBookingDuration(
 *   new Date("2024-01-15T10:00:00Z"),
 *   new Date("2024-01-15T11:30:00Z")
 * );
 * // result.minutes === 90
 * ```
 */
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

/**
 * Convenience function that returns just the duration in minutes as a number.
 * Useful for Prisma Float field mapping where you only need the numeric value.
 *
 * @param startDateTime - The booking start time
 * @param endDateTime - The booking end time
 * @returns Duration in minutes as a positive number
 * @throws {InvalidBookingDurationError} If end time is not after start time
 *
 * @example
 * ```typescript
 * // For Prisma Float field
 * const duration = getBookingDurationInMinutes(
 *   "2024-01-15T10:00:00Z",
 *   "2024-01-15T11:00:00Z"
 * );
 * // Can be directly used: prisma.booking.create({ data: { duration } })
 * ```
 */
export const getBookingDurationInMinutes = (
  startDateTime: Date | string,
  endDateTime: Date | string,
): number => {
  return calculateBookingDuration(startDateTime, endDateTime).minutes;
};
