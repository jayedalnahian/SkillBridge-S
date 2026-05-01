import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { StudentService } from "./student.service.js";

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getAllStudents(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Students fetched successfully",
    data: result.data,
    meta: result.meta,
    error: null,
  });
});

const getStudentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.getStudentById(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student fetched successfully",
    data: result,
    error: null,
  });
});

const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await StudentService.updateStudent(id as string, payload);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student updated successfully",
    data: result,
    error: null,
  });
});

const softDeleteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.softDeleteStudent(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student deleted successfully",
    data: result,
    error: null,
  });
});

const bulkSoftDeleteStudents = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const result = await StudentService.bulkSoftDeleteStudents(ids as string[]);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Successfully deleted ${result.deleted.length} student(s)`,
    data: result,
    error: null,
  });
});

const hardDeleteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.hardDeleteStudent(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student permanently deleted",
    data: result,
    error: null,
  });
});

const restoreStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.restoreStudent(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student restored successfully",
    data: result,
    error: null,
  });
});

export const StudentController = {
  getAllStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  bulkSoftDeleteStudents,
  hardDeleteStudent,
  restoreStudent,
};
