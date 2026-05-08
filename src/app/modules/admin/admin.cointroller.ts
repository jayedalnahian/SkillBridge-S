import status from "http-status";
import { sendResponse } from "../../shared/sendResponse.js";
import { catchAsync } from "../../shared/catchAsync.js";
import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { IAdminPayload, IAdminQueryParams, IAdminUpdatePayload } from "./admin.type.js";
import prismaPkg from "../../generated/prisma/index.js";
import type { UserRole as TUserRole } from "../../generated/prisma/index.js";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllAdmins(req.query as IAdminQueryParams);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins fetched successfully",
    data: result,
    error: null,
  });
});

const getSingleAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getSingleAdmin(req.params.id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: result,
    error: null,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user?.role as TUserRole;
  const adminId = req.params.id as string;
  const userId = req.user?.userId as string;

  const result = await adminService.updateAdmin(
    adminId,
    userId,
    req.body as IAdminUpdatePayload,
    userRole,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin updated successfully",
    data: result,
    error: null,
  });
});

const hardDeleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.params.id as string;
  const userId = req.user?.userId as string;

  const result = await adminService.hardDeleteAdmin(adminId, userId);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin permanently deleted",
    data: result,
    error: null,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.createAdmin(req.body as IAdminPayload);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result,
    error: null,
  });
});

const getDashboardData = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getDashboardData();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dashboard data fetched successfully",
    data: result,
    error: null,
  });
});

export const adminController = {
  getAllAdmins,
  getSingleAdmin,
  createAdmin,
  updateAdmin,
  hardDeleteAdmin,
  getDashboardData,
};
