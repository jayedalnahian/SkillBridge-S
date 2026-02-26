import { Request, Response } from "express";
import httpStatus from "http-status";

import { ReviewService } from "./review.service";
import { IRequestUser } from "../../interface/requestUser.interface";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { IReviewQueryParams } from "./review.type";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await ReviewService.createReview(user, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review submitted successfully",
        data: result,
        error: null,
    });
});



const getReviews = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await ReviewService.getReviews(
        user,
        req.query as IReviewQueryParams,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews fetched successfully",
        data: result,
        error: null,
    });
});

export const ReviewController = {
    createReview,
    getReviews,
};