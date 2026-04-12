import { z } from "zod";
import { createBookingSchema } from "./booking.validate";
import { BookingStatus } from "../../generated/prisma";

export type ICreateBookingPayload = z.infer<typeof createBookingSchema>;

export interface IBookingQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fields?: string;
  include?: string;
  // filters
  status?: BookingStatus;
  tutorId?: string;
  startDateTime?: string;
  endDateTime?: string;
  [key: string]: string | undefined;
}
