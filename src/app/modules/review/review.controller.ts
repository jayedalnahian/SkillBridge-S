import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { ReviewService } from "./review.service.js";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await ReviewService.createReview(userId, req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
    error: null,
  });
});

const getReviewsByTutor = catchAsync(async (req: Request, res: Response) => {
  const tutorId = req.params.tutorId as string;
  const result = await ReviewService.getReviewsByTutor(tutorId);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Reviews fetched successfully",
    data: result,
    error: null,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId as string;
  const result = await ReviewService.getMyReviews(studentId);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My reviews fetched successfully",
    data: result,
    error: null,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId as string;
  const reviewId = req.params.id as string;
  const result = await ReviewService.updateReview(reviewId, studentId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
    error: null,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId as string;
  const reviewId = req.params.id as string;
  const result = await ReviewService.deleteReview(reviewId, studentId);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
    error: null,
  });
});

export const ReviewController = {
  createReview,
  getReviewsByTutor,
  getMyReviews,
  updateReview,
  deleteReview,
};