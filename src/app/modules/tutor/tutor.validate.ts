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
        availabilityStartTime: z
            .string("Availability Start Time is required")
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
        availabilityEndTime: z
            .string("Availability End Time is required")
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    }),
    categories: z.array(z.uuid("each specialty must be a valid UUID"), "specialties must be an array of UUIDs").min(1, "at least one specialty is required")
})


export const updateTutorSchema = z.object({
    name: z.string("Name is required").optional(),
    email: z.string("Email is required").optional(),
    contactNumber: z.string("Contact Number is required").optional(),
    profilePhoto: z.string().optional(),
    designation: z.string("Designation is required").optional(),
    educationLevel: z.string("Education Level is required").optional(),
    experienceYears: z.number("Experience Years is required").optional(),
    hourlyRate: z.number("Hourly Rate is required").optional(),
    availableDays: z.array(z.enum(DaysOfWeek), "availableDays must be an array of DaysOfWeek").min(1, "at least one available day is required").optional(),
    availabilityStartTime: z
        .string("Availability Start Time is required")
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
    availabilityEndTime: z
        .string("Availability End Time is required")
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
})