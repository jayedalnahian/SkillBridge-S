import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";
import { catchAsync } from "../../shared/catchAsync";
import { Request, Response } from "express";
import { TutorService } from "./tutor.service";
import { IQueryParams } from "../../interface/query.interface";
import { ITutorPayload, ITutorUpdatePayload } from "./tutor.type";
import AppError from "../../errorHalpers/AppError";
import { UserRole } from "../../generated/prisma";

const getAllTutors = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.getAllTutors(req.query as IQueryParams);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor fetched successfully",
    data: result,
    error: null,
  });
});

const getSingleTutor = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.getSingleTutor(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor fetched successfully",
    data: result,
    error: null,
  });
});

const createTutor = catchAsync(async (req: Request, res: Response) => {


  const result = await TutorService.createTutor(
    req.body as ITutorPayload,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor created successfully",
    data: result,
    error: null,
  });
});

const updateTutor = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user?.role as UserRole;
  const tutorId = req.params.id as string;
  const userId = req.user?.userId as string;

  const result = await TutorService.updateTutor(
    tutorId,
    userId,
    req.body as ITutorUpdatePayload,
    userRole,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor updated successfully",
    data: result,
    error: null,
  });
});

const deleteTutor = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.deleteTutor(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor deleted successfully",
    data: result,
    error: null,
  });
});

export const TutorController = {
  getAllTutors,
  getSingleTutor,
  createTutor,
  updateTutor,
  deleteTutor,
};
