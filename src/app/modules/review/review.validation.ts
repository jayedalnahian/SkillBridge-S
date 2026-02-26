import { z } from "zod";

const createReview = z.object({
        bookingId: z
            .string("Booking ID is required")
            .min(1, "Booking ID cannot be empty"),

        rating: z
            .number("Rating is required")
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot exceed 5")
            .multipleOf(0.5, "Rating must be in increments of 0.5 (e.g. 1, 1.5, 2 ...)"),

        comment: z
            .string("Comment is required")
            .min(10, "Comment must be at least 10 characters")
            .max(1000, "Comment cannot exceed 1000 characters")
            .trim(),
    })

export const ReviewValidation = {
    createReview,
};