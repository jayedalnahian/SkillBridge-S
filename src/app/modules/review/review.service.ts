import { prisma } from "../../lib/prisma.js";
import status from "http-status";
import AppError from "../../errorHalpers/AppError.js";
import { IReviewCreateInput, IReviewUpdateInput } from "./review.type.js";
import { calculateTutorAvgRating } from "../../utils/calculateTutorAvgRating.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { UserRole } from "../../generated/prisma/client.js";
import {
  reviewSearchableFields,
  reviewFilterableFields,
} from "./review.constent.js";

const createReview = async (userId: string, payload: IReviewCreateInput) => {
const student = await prisma.student.findUnique({
  where: {
    userId: userId,
  },
});

if (!student) {
  throw new AppError(status.NOT_FOUND, "Student not found");
}

const studentId = student.id;

  // Check if booking exists and belongs to the student
  const booking = await prisma.booking.findFirst({
    where: {
      id: payload.bookingId,
      studentId: studentId,
      isDeleted: false,
    },
    include: {
      Tutor: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found or does not belong to you");
  }

  // Check if booking is completed
  if (booking.status !== "COMPLETED") {
    throw new AppError(status.BAD_REQUEST, "Can only review completed bookings");
  }

  // Check if tutor matches
  if (booking.tutorId !== payload.tutorId) {
    throw new AppError(status.BAD_REQUEST, "Tutor does not match the booking");
  }

  // Check if student already reviewed this booking
  const existingReview = await prisma.review.findFirst({
    where: {
      studentId: studentId,
      bookingId: payload.bookingId,
      isDeleted: false,
    },
  });

  if (existingReview) {
    throw new AppError(status.BAD_REQUEST, "You have already reviewed this booking");
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      studentId: studentId,
      tutorId: payload.tutorId,
      bookingId: payload.bookingId,
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  // Update tutor's average rating
  const newAvgRating = await calculateTutorAvgRating(payload.tutorId);
  await prisma.tutor.update({
    where: { id: payload.tutorId },
    data: { avgRating: newAvgRating },
  });

  return review;
};

const getAllReviews = async (
  query: IQueryParams,
  userRole?: UserRole,
  userId?: string,
) => {
  // Initialize filter if not exists
  if (!query.filter) {
    query.filter = {};
  }

  // Apply role-based filtering for authenticated users
  if (userRole === UserRole.STUDENT && userId) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new AppError(status.NOT_FOUND, "Student not found");
    }
    query.filter.studentId = student.id;
  }

  if (userRole === UserRole.TUTOR && userId) {
    const tutor = await prisma.tutor.findUnique({
      where: { userId },
    });
    if (!tutor) {
      throw new AppError(status.NOT_FOUND, "Tutor not found");
    }
    query.filter.tutorId = tutor.id;
  }

  // Admin sees all reviews (no additional filter)

  const reviewQuery = new QueryBuilder(prisma.review, query, {
    searchableFields: reviewSearchableFields,
    filterableFields: reviewFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .fields();

  const result = await reviewQuery.execute();
  return result;
};



const updateReview = async (
  reviewId: string,
  studentId: string,
  payload: IReviewUpdateInput
) => {
  // Check if review exists and belongs to student
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      studentId: studentId,
      isDeleted: false,
    },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  // Update the review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  // Update tutor's average rating
  const newAvgRating = await calculateTutorAvgRating(review.tutorId);
  await prisma.tutor.update({
    where: { id: review.tutorId },
    data: { avgRating: newAvgRating },
  });

  return updatedReview;
};

const deleteReview = async (reviewId: string, studentId: string) => {
  // Check if review exists and belongs to student
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      studentId: studentId,
      isDeleted: false,
    },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  // Soft delete the review
  const deletedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // Update tutor's average rating
  const newAvgRating = await calculateTutorAvgRating(review.tutorId);
  await prisma.tutor.update({
    where: { id: review.tutorId },
    data: { avgRating: newAvgRating },
  });

  return deletedReview;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
};