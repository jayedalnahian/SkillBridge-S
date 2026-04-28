import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interface/error.interface.js";


export const handlZodError = (err: z.ZodError): TErrorResponse => {
    const statusCode = status.BAD_REQUEST;
    const message = "Zod Validation Error";
    const errorSources: TErrorSources[] = []
    err.issues.forEach(issue => {
        errorSources.push({
            path: issue.path.length > 1 ? issue.path.join("=>") : issue.path[0].toString(),
            message: issue.message
        })
    })

    return {
        stack: err.stack,
        success: false,
        message,
        errorSources,
        statusCode
    }
}
