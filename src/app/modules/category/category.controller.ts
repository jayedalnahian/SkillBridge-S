import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { CategoryService } from "./category.service.js";
import AppError from "../../errorHalpers/AppError.js";

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

const getCategoriesUsedByTutors = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm } = req.query;
  const result = await CategoryService.getCategoriesUsedByTutors(searchTerm as string | undefined);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Categories used by tutors fetched successfully",
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

const bulkDeleteCategories = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const result = await CategoryService.bulkDeleteCategories(ids as string[]);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Successfully deleted ${result.deleted.length} categor${result.deleted.length === 1 ? 'y' : 'ies'}`,
    data: result,
    error: null,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await CategoryService.updateCategory(id as string, payload);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
    error: null,
  });
});

const restoreCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.restoreCategory(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category restored successfully",
    data: result,
    error: null,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoriesUsedByTutors,
  deleteCategory,
  bulkDeleteCategories,
  updateCategory,
  restoreCategory,
};
