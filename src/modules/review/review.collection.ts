import { Request, Response } from "express"
import { reviewService } from "./review.service"

const createReviewController = async (req: Request, res: Response) => {
    try {
        const studentId = req.user?.userProfileId
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Missing student information",
            })
        }

        const { bookingId, rating, comment } = req.body

        const review = await reviewService.createReview({
            bookingId,
            studentId,
            rating: Number(rating),
            comment,
        })

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: review,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}





export const reviewController = { createReviewController }