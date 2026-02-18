
import { Prisma } from "@prisma/client/extension";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/client";
import status from "http-status";
import { TErrorSources } from "../app/interface/error.interface";

export const handlePrismaError = (err: any) => {
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = "Something went wrong";
    let errorSources: TErrorSources[] = [];

    // ✅ Known Prisma errors
    if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                statusCode = status.CONFLICT;
                message = "Duplicate field value";
                errorSources = [
                    {
                        path: err.meta?.target as string,
                        message: "This value already exists",
                    },
                ];
                break;

            case "P2025":
                statusCode = status.NOT_FOUND;
                message = "Record not found";
                break;

            case "P2003":
                statusCode = status.BAD_REQUEST;
                message = "Invalid foreign key";
                break;

            default:
                message = "Database error";
        }
    }

    // ✅ Validation error
    else if (err instanceof PrismaClientValidationError) {
        statusCode = status.BAD_REQUEST;
        message = "Invalid query data";
    }

    return {
        statusCode,
        message,
        errorSources,
    };
};
