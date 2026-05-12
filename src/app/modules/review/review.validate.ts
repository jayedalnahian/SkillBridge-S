import { z } from "zod";

export const createReviewSchema = z.object({
  tutorId: z.string("Invalid tutor ID"),
  bookingId: z.string("Invalid booking ID"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(500, "Comment must be less than 500 characters").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
  comment: z.string().min(1, "Comment is required").max(500, "Comment must be less than 500 characters").optional(),
});

export type IReviewCreateInput = z.infer<typeof createReviewSchema>;
export type IReviewUpdateInput = z.infer<typeof updateReviewSchema>;
