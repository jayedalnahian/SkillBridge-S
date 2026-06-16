import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env.js";
import status from "http-status";
import z from "zod";
// import { handlZodError } from "../app/errorHalpers/handleZodError";
import AppError from "../errorHalpers/AppError.js";
// import { deleteFileFromCloudinary } from "../config/cloudinary.config";
import { TErrorResponse, TErrorSources } from "../interface/error.interface.js";
import { handlZodError } from "../errorHalpers/handleZodError.js";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import { handlePrismaError } from "../errorHalpers/handlePrismaError.js";
// import { deleteFileFromCloudinary } from "../config/cloudinary.config.js";

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE_ENV === "development") {
    console.log("Global Error Handler caught an error:");
    console.error(err);
  }

  // if (req.file) {
  //   // await deleteFileFromCloudinary(req.file.path);
  // }

  // if (req.files && Array.isArray(req.files) && req.files.length > 0) {


  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Internal Server Error";
  let stack: string | undefined = undefined;

  if (err instanceof z.ZodError) {
    const simplifiedError = handlZodError(err);
    statusCode = simplifiedError.statusCode as number;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
  } else if (
    err instanceof PrismaClientKnownRequestError ||
    err instanceof PrismaClientValidationError
  ) {
    const simplifiedError = handlePrismaError(err);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    errorSources: errorSources,
    error: envVars.NODE_ENV === "development" ? err : undefined,
    stack: envVars.NODE_ENV === "development" ? stack : undefined,
  };
  res.status(statusCode).json(errorResponse);
};
