import status from "http-status";
import { sendResponse } from "../../shared/sendResponse.js";
import { catchAsync } from "../../shared/catchAsync.js";
import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { IQueryParams } from "../../interface/query.interface.js";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllAdmins(req.query as IQueryParams);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins fetched successfully",
    data: result,
    error: null,
  });
});

export const adminController = {
  getAllAdmins,
};
