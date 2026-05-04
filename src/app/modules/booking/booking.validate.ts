import { z } from "zod";
export const bookingSchema = z.object({
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
});

/**
 * Zod schema for creating a new booking
 * Includes validation that endDateTime must be after startDateTime
 */
export const createBookingSchema = bookingSchema.refine(
  (data) => data.endDateTime > data.startDateTime,
  {
    message: "End date/time must be after start date/time",
    path: ["endDateTime"],
  },
);
export const updateBookingSchema = bookingSchema
  .partial()
  .refine(
    (data) => {
      // Only validate date order if both dates are provided
      if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
      }
      return true;
    },
    {
      message: "End date/time must be after start date/time",
      path: ["endDateTime"],
    },
  );

/**
 * TypeScript type inferred from the base booking schema
 */
export type IBooking = z.infer<typeof bookingSchema>;

/**
 * TypeScript type for creating a booking
 */
export type IBookingCreateInput = z.infer<typeof createBookingSchema>;

/**
 * TypeScript type for updating a booking
 */
export type IBookingUpdateInput = z.infer<typeof updateBookingSchema>;
