import { BookingStatus } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"
import { CreateReviewInput } from "./review.types"

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


export const reviewService = {createReview}