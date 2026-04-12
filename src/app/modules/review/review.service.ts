import status from "http-status";
import AppError from "../../errorHalpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interface/requestUser.interface";
import { ICreateReviewPayload, IReviewQueryParams } from "./review.type";

import {
    REVIEW_SEARCHABLE_FIELDS,
    REVIEW_FILTERABLE_FIELDS,
    REVIEW_INCLUDE_CONFIG,
    REVIEW_DEFAULT_INCLUDES,
} from "./review.constant";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createReview = async (user: IRequestUser, payload: ICreateReviewPayload) => {
    const { bookingId, rating, comment } = payload;
    const studentId = user.userId;

    // 1. Verify the booking exists, belongs to this student, and is not deleted
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            userId: studentId,
            isDeleted: false,
        },
        select: {
            id: true,
            userId: true,
            tutorId: true,
            status: true,
        },
    });

    if (!booking) {
        throw new AppError(
            status.NOT_FOUND,
            "Booking not found or you do not have access to this booking",
        );
    }

    // 2. Only COMPLETED bookings can be reviewed
    if (booking.status !== "COMPLETED") {
        throw new AppError(
            status.BAD_REQUEST,
            `You can only review a completed booking. Current status: ${booking.status}`,
        );
    }

    // 3. Prevent duplicate reviews — one review per booking
    const existingReview = await prisma.review.findFirst({
        where: {
            bookingId,
            userId: studentId,
            isDeleted: false,
        },
        select: { id: true },
    });

    if (existingReview) {
        throw new AppError(
            status.CONFLICT,
            "You have already submitted a review for this booking",
        );
    }

    // 4. Create the review
    const review = await prisma.review.create({
        data: {
            userId: studentId,
            tutorId: booking.tutorId,
            bookingId,
            rating,
            comment,
        },
        include: {
            User: {
                select: {
                    id: true,
                    email: true,
                },
            },
            Tutor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    designation: true,
                },
            },
            Booking: {
                select: {
                    id: true,
                    startDateTime: true,
                    endDateTime: true,
                    duration: true,
                    price: true,
                    status: true,
                },
            },
        },
    });

    return review;
};


// ─── Get Reviews ──────────────────────────────────────────────────────────────

const getReviews = async (user: IRequestUser, queryParams: IReviewQueryParams) => {
    const isTutor = user.role === "TUTOR";

    // Resolve tutorId from the Tutor table since IRequestUser carries the User FK
    let tutorRowId: string | undefined;
    if (isTutor) {
        const tutor = await prisma.tutor.findUnique({
            where: { userId: user.userId, isDeleted: false },
            select: { id: true },
        });

        if (!tutor) {
            throw new AppError(status.NOT_FOUND, "Tutor profile not found");
        }

        tutorRowId = tutor.id;
    }

    // Tutors are locked to their own reviews — cannot be overridden by query params
    const baseCondition: Record<string, unknown> = {
        isDeleted: false,
        ...(isTutor && { tutorId: tutorRowId }),
    };

    // Tutors must not be able to spoof another tutor's reviews via ?tutorId=...
    const allowedFilterableFields = REVIEW_FILTERABLE_FIELDS.filter((f) => {
        if (isTutor && f === "tutorId") return false;
        return true;
    });

    const result = await new QueryBuilder(
        prisma.review,
        queryParams,
        {
            searchableFields: REVIEW_SEARCHABLE_FIELDS,
            filterableFields: allowedFilterableFields,
        },
    )
        .where(baseCondition)
        .search()
        .filter()
        .sort()
        .paginate()
        .dynamicInclude(REVIEW_INCLUDE_CONFIG, [...REVIEW_DEFAULT_INCLUDES])
        .execute();

    return result;
};

export const ReviewService = {
    createReview,
    getReviews
};