import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log("Entering validateRequest middleware...");
        console.log("Request Body:", JSON.stringify(req.body, null, 2));
        console.log("Request Headers:", JSON.stringify(req.headers, null, 2));

        if (req.body.data) {
            console.log("Found data field in body, attempting to parse JSON...");
            try {
                req.body = JSON.parse(req.body.data);
            } catch (error) {
                console.error("Failed to parse JSON in data field:", error);
                return next(new z.ZodError([{ path: ["body", "data"], message: "Invalid JSON in data field", code: "custom" }]));
            }
        }

        const parsedResult = zodSchema.safeParse(req.body);

        if (!parsedResult.success) {
            console.error("Zod Validation Failed:", JSON.stringify(parsedResult.error.format(), null, 2));
            return next(parsedResult.error);
        }

        console.log("Zod Validation Passed.");
        // sanitizing the data
        req.body = parsedResult.data;

        next();
    }
}
