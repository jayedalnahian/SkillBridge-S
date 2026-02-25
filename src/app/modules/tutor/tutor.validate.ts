import z from "zod";
import { DaysOfWeek } from "../../../generated/prisma/enums";

export const createTutorSchema = z.object({
    password: z.string("password is required").min(6, "password must be at lease 6 characters").max(20, "password must be at most 20 characters"),
    tutor: z.object({
        name: z.string("Name is required"),
        email: z.string("Email is required"),
        contactNumber: z.string("Contact Number is required"),
        profilePhoto: z.string().optional(),
        designation: z.string("Designation is required"),
        educationLevel: z.string("Education Level is required"),
        experienceYears: z.number("Experience Years is required"),
        hourlyRate: z.number("Hourly Rate is required"),
        availableDays: z.array(z.enum(DaysOfWeek), "availableDays must be an array of DaysOfWeek").min(1, "at least one available day is required"),
        availabilityStartTime: z.string("Availability Start Time is required"),
        availabilityEndTime: z.string("Availability End Time is required"),
    }),
    categories: z.array(z.uuid("each specialty must be a valid UUID"), "specialties must be an array of UUIDs").min(1, "at least one specialty is required")
})