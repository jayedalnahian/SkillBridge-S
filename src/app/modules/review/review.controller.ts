import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { ReviewService } from "./review.service.js";
import { UserRole } from "../../generated/prisma/client.js";

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

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const userRole = req.user?.role as UserRole;
  const userId = req.user?.userId as string;
  const result = await ReviewService.getAllReviews(query, userRole, userId);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Reviews retrieved successfully",
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
  getAllReviews,
  updateReview,
  deleteReview,
};