import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import AppError from "../../errorHalpers/AppError";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await CategoryService.createCategory(payload);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category created successfully",
    data: result,
    error: null,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result.data,
    meta: result.meta,
    error: null,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
    error: null,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await CategoryService.updateCategory(
    id as string,
    payload,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
    error: null,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
};
