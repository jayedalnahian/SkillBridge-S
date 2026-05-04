import { IBookingCreateInput as BookingCreateInput } from "./booking.validate.js";

export interface IBookingCreateInput {
    payload: BookingCreateInput;
    tutorId: string;
    studentId: string;
}
