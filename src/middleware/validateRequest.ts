import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateReauest = (zodSchema: z.ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Handle multipart/form-data (when sending JSON as string)
            if (req.body?.data) {
                req.body = JSON.parse(req.body.data);
            }

            const parsedResult = zodSchema.safeParse(req.body);

            if (!parsedResult.success) {
                return next(parsedResult.error);
            }

            req.body = parsedResult.data;

            next();
        } catch (error) {
            next(error);
        }
    };
};