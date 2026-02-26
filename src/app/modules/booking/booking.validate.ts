import { z } from "zod";

export const createBookingSchema = z.object({
        tutorId: z.string("Tutor ID is required"),
        startDateTime: z.string("Start Date and Time is required").refine((val) => new Date(val) > new Date(), {
            message: "Start Date and Time must be in the future",
        }),
        endDateTime: z.string("End Date and Time is required"),
        meetingLink: z.string("Meeting Link is required"),
    }).refine((data) => new Date(data.endDateTime) > new Date(data.startDateTime), {
        message: "End Date and Time must be after Start Date and Time",
        path: ["endDateTime"],
    })


export const BookingValidation = {
    createBookingSchema,
};
