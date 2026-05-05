import { describe, it, expect } from "vitest";
import {
  calculateBookingDuration,
  getBookingDurationInMinutes,
  InvalidBookingDurationError,
} from "../../app/utils/booking.js";

describe("calculateBookingDuration", () => {
  describe("valid bookings", () => {
    it("should calculate a standard 60-minute booking correctly", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T11:00:00Z";

      const result = calculateBookingDuration(startTime, endTime);

      expect(result.minutes).toBe(60);
      expect(result.wholeMinutes).toBe(60);
      expect(result.hours).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it("should calculate a booking that spans across midnight correctly", () => {
      const startTime = "2024-01-15T23:30:00Z";
      const endTime = "2024-01-16T01:15:00Z";

      const result = calculateBookingDuration(startTime, endTime);

      expect(result.minutes).toBe(105);
      expect(result.wholeMinutes).toBe(105);
      expect(result.hours).toBe(1.75);
      expect(result.isValid).toBe(true);
    });

    it("should handle Date objects as input", () => {
      const startTime = new Date("2024-01-15T10:00:00Z");
      const endTime = new Date("2024-01-15T11:30:00Z");

      const result = calculateBookingDuration(startTime, endTime);

      expect(result.minutes).toBe(90);
      expect(result.wholeMinutes).toBe(90);
      expect(result.hours).toBe(1.5);
      expect(result.isValid).toBe(true);
    });

    it("should handle partial minutes with precision", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T10:45:30Z";

      const result = calculateBookingDuration(startTime, endTime);

      expect(result.minutes).toBe(45.5);
      expect(result.wholeMinutes).toBe(45);
      expect(result.isValid).toBe(true);
    });
  });

  describe("invalid bookings", () => {
    it("should throw InvalidBookingDurationError when end time is before start time", () => {
      const startTime = "2024-01-15T12:00:00Z";
      const endTime = "2024-01-15T10:00:00Z";

      expect(() => calculateBookingDuration(startTime, endTime)).toThrow(
        InvalidBookingDurationError,
      );
      expect(() => calculateBookingDuration(startTime, endTime)).toThrow(
        /end time .* must be after start time/,
      );
    });

    it("should throw InvalidBookingDurationError when start and end times are equal", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T10:00:00Z";

      expect(() => calculateBookingDuration(startTime, endTime)).toThrow(
        InvalidBookingDurationError,
      );
    });

    it("should allow invalid durations in non-strict mode", () => {
      const startTime = "2024-01-15T12:00:00Z";
      const endTime = "2024-01-15T10:00:00Z";

      const result = calculateBookingDuration(startTime, endTime, {
        strict: false,
      });

      expect(result.minutes).toBe(-120);
      expect(result.isValid).toBe(false);
    });
  });

  describe("input validation", () => {
    it("should throw TypeError for invalid date string", () => {
      const invalidDate = "not-a-valid-date";

      expect(() => calculateBookingDuration(invalidDate, "2024-01-15T11:00:00Z")).toThrow(
        TypeError,
      );
      expect(() => calculateBookingDuration(invalidDate, "2024-01-15T11:00:00Z")).toThrow(
        /Invalid date string provided/,
      );
    });

    it("should throw TypeError for invalid Date object", () => {
      const invalidDate = new Date("invalid");

      expect(() => calculateBookingDuration(invalidDate, new Date())).toThrow(
        TypeError,
      );
    });

    it("should throw TypeError for non-date input types", () => {
      expect(() =>
        calculateBookingDuration(123 as unknown as string, "2024-01-15T11:00:00Z"),
      ).toThrow(TypeError);
    });
  });

  describe("getBookingDurationInMinutes", () => {
    it("should return duration in minutes as a number", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T11:30:00Z";

      const duration = getBookingDurationInMinutes(startTime, endTime);

      expect(typeof duration).toBe("number");
      expect(duration).toBe(90);
    });

    it("should throw InvalidBookingDurationError for invalid range", () => {
      const startTime = "2024-01-15T12:00:00Z";
      const endTime = "2024-01-15T10:00:00Z";

      expect(() => getBookingDurationInMinutes(startTime, endTime)).toThrow(
        InvalidBookingDurationError,
      );
    });
  });

  describe("minimum duration option", () => {
    it("should mark duration as invalid when below minimum", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T10:15:00Z";

      const result = calculateBookingDuration(startTime, endTime, {
        minDuration: 30,
      });

      expect(result.minutes).toBe(15);
      expect(result.isValid).toBe(false);
    });

    it("should mark duration as valid when meeting minimum", () => {
      const startTime = "2024-01-15T10:00:00Z";
      const endTime = "2024-01-15T10:30:00Z";

      const result = calculateBookingDuration(startTime, endTime, {
        minDuration: 30,
      });

      expect(result.minutes).toBe(30);
      expect(result.isValid).toBe(true);
    });
  });
});
