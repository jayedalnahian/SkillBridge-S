import { BookingStatus } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"
import { CreateReviewInput, GetTutorReviewsInput, ReplyToReviewInput } from "./review.types"

const createReview = async ({
    bookingId,
    studentId,
    rating,
    comment,
}: CreateReviewInput) => {
    // 1️⃣ Get booking with review relation
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            tutorProfile: true,
            review: true, // Add this line
        },
    })

    if (!booking) {
        throw new Error("Booking not found")
    }

    if (booking.studentId !== studentId) {
        throw new Error("You are not authorized to review this booking")
    }

    if (booking.status !== BookingStatus.COMPLETED) {
        throw new Error("Booking must be completed before writing a review")
    }

    // Now you can check if review exists
    if (booking.review) {
        throw new Error("Review already exists for this booking")
    }

    // 2️⃣ Create review using transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
        // Create the review
        const review = await tx.review.create({
            data: {
                bookingId,
                studentId,
                tutorProfileId: booking.tutorProfileId,
                rating,
                comment,
            },
        })

        // Calculate new average rating
        const tutorProfile = await tx.tutorProfile.findUnique({
            where: { id: booking.tutorProfileId },
            select: { averageRating: true, totalReviews: true }
        })

        if (!tutorProfile) {
            throw new Error("Tutor profile not found")
        }

        const newTotalReviews = tutorProfile.totalReviews + 1
        const newAverageRating = (
            (Number(tutorProfile.averageRating) * tutorProfile.totalReviews) + rating
        ) / newTotalReviews

        // Update tutor's average rating and total reviews
        await tx.tutorProfile.update({
            where: { id: booking.tutorProfileId },
            data: {
                totalReviews: newTotalReviews,
                averageRating: newAverageRating,
            },
        })

        return review
    })

    return result
}



const getTutorReviews = async ({
    tutorProfileId,
    page,
    limit,
    rating,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeTutorInfo = false,
}: GetTutorReviewsInput) => {
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = { tutorProfileId }

    // Filter by rating if provided
    if (rating !== undefined && rating >= 1 && rating <= 5) {
        whereClause.rating = rating
    }

    // Validate tutor exists
    const tutorExists = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
        select: { id: true }
    })

    if (!tutorExists) {
        throw new Error("Tutor profile not found")
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'rating', 'updatedAt']
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { [safeSortBy]: sortOrder },
            include: {
                student: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                booking: {
                    select: {
                        id: true,
                        startDateTime: true,
                        meetingType: true,
                    },
                },
            },
        }),
        prisma.review.count({ where: whereClause }),
    ])

    // Get tutor info if requested
    let tutorInfo = null
    if (includeTutorInfo) {
        tutorInfo = await prisma.tutorProfile.findUnique({
            where: { id: tutorProfileId },
            select: {
                id: true,
                averageRating: true,
                totalReviews: true,
                userProfile: {
                    select: {
                        user: {
                            select: {
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        })
    }

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
        by: ['rating'],
        where: { tutorProfileId },
        _count: { rating: true },
        orderBy: { rating: 'desc' }
    })

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
        data: reviews,
        tutorInfo,
        statistics: {
            averageRating: tutorInfo?.averageRating || 0,
            totalReviews: total,
            ratingDistribution: ratingDistribution.reduce((acc, curr) => ({
                ...acc,
                [curr.rating]: curr._count.rating
            }), {}),
        }
    }
}


const replyToReview = async ({
    reviewId,
    tutorProfileId,
    response,
}: ReplyToReviewInput) => {
    // Check review exists and belongs to tutor
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    })

    if (!review) {
        throw new Error("Review not found")
    }

    if (review.tutorProfileId !== tutorProfileId) {
        throw new Error("You are not authorized to respond to this review")
    }

    // Update review with tutor response
    const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
            tutorResponse: response,
            respondedAt: new Date(),
        },
    })

    return updatedReview
}




export const reviewService = { createReview, getTutorReviews, replyToReview }