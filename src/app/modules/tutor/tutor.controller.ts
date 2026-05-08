import status from "http-status";
import { sendResponse } from "../../shared/sendResponse.js";
import { catchAsync } from "../../shared/catchAsync.js";
import { Request, Response } from "express";
import { TutorService } from "./tutor.service.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { ITutorPayload, ITutorUpdatePayload } from "./tutor.type.js";
import AppError from "../../errorHalpers/AppError.js";
import prismaPkg from "../../generated/prisma/index.js";
import type { UserRole as TUserRole } from "../../generated/prisma/index.js";

const { UserRole } = prismaPkg as any;

const getAllTutors = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.getAllTutors(req.query as IQueryParams);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutors fetched successfully",
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

const getAssignedCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.getAssignedCategories(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Assigned categories fetched successfully",
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
  const userRole = req.user?.role as TUserRole;
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


const bulkDeleteTutors = catchAsync(async (req: Request, res: Response) => {
const { ids } = req.body;
  const result = await TutorService.bulkSoftDeleteTutors(ids as string[]);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor permanently deleted",
    data: result,
    error: null,
  })
});


const restoreTutor = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.restoreTutor(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor restored successfully",
    data: result,
    error: null,
  });
});

const hardDeleteTutor = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorService.hardDeleteTutor(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor permanently deleted",
    data: result,
    error: null,
  });
});

const getDashboardData = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await TutorService.getDashboardData(userId as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tutor dashboard data fetched successfully",
    data: result,
    error: null,
  });
});

export const TutorController = {
  getAllTutors,
  getSingleTutor,
  getAssignedCategories,
  createTutor,
  updateTutor,
  bulkDeleteTutors,
  restoreTutor,
  hardDeleteTutor,
  getDashboardData,
};
