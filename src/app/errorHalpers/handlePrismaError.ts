import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import status from "http-status";
import { TErrorSources } from "../interface/error.interface.js";

type TPrismaErrorResponse = {
  statusCode: number;
  message: string;
  errorSources: TErrorSources[];
};

export const handlePrismaError = (
  err: PrismaClientKnownRequestError | PrismaClientValidationError
): TPrismaErrorResponse => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Unexpected database error";
  let errorSources: TErrorSources[] = [
    {
      path: "",
      message: "An unknown database error occurred.",
    },
  ];

  if (err instanceof PrismaClientKnownRequestError) {
    // Determine mapping based on error code
    switch (err.code) {
      case "P2002": {
        statusCode = status.CONFLICT;
        message = "Duplicate/unique constraint error";
        const target = err.meta?.target;
        
        let path = "";
        if (Array.isArray(target)) {
          path = target.join(", ");
        } else if (typeof target === "string") {
          path = target;
        }

        errorSources = [
          {
            path,
            message: `${path ? path + " already exists. " : ""}Please provide a unique value.`,
          },
        ];
        break;
      }
      case "P2025": {
        statusCode = status.NOT_FOUND;
        message = "Record not found";
        const cause = err.meta?.cause as string;
        
        errorSources = [
          {
            path: "",
            message: cause || "The requested record was not found.",
          },
        ];
        break;
      }
      case "P2003": {
        statusCode = status.BAD_REQUEST;
        message = "Foreign key constraint failed";
        const fieldName = err.meta?.field_name as string;
        
        errorSources = [
          {
            path: fieldName || "",
            message: fieldName 
              ? `Foreign key constraint failed on the field: ${fieldName}` 
              : "Foreign key constraint failed.",
          },
        ];
        break;
      }
      default: {
        statusCode = status.BAD_REQUEST;
        message = "Database conflict error";
        errorSources = [
          {
            path: "",
            message: "A database error occurred.",
          },
        ];
        break;
      }
    }
  } else if (err instanceof PrismaClientValidationError) {
    statusCode = status.BAD_REQUEST;
    message = "Validation Error";
    // Avoid exposing raw database query details
    errorSources = [
      {
        path: "",
        message: "Provided data is invalid. Please ensure all fields are correctly formatted.",
      },
    ];
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};
