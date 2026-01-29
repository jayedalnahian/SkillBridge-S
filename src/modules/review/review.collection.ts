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



const getTutorReviewsController = async (req: Request, res: Response) => {
    try {
        const tutorProfileId = req.params.tutorId as string

        if (!tutorProfileId || typeof tutorProfileId !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Valid Tutor ID is required",
                data: null,
                error: "Invalid tutor ID parameter",
            })
        }

        // Validate UUID format (optional but recommended)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(tutorProfileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Tutor ID format",
                data: null,
                error: "Tutor ID must be a valid UUID",
            })
        }

        // Pagination with validation
        const page = Math.max(1, req.query.page ? Number(req.query.page) : 1)
        const limit = Math.min(100, Math.max(1, req.query.limit ? Number(req.query.limit) : 10))

        // Optional filters
        const rating = req.query.rating ? Number(req.query.rating) : undefined
        const sortBy = (req.query.sortBy as string) || 'createdAt'
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc'

        const result = await reviewService.getTutorReviews({
            tutorProfileId,
            page,
            limit,
            rating,
            sortBy,
            sortOrder,
        })

        res.status(200).json({
            success: true,
            message: "Tutor reviews retrieved successfully",
            meta: result.meta,
            data: result.data,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error: error.message || error,
        })
    }
}




export const reviewController = { getTutorReviewsController, createReviewController }