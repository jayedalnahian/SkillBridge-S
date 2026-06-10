import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        console.error("Failed to parse JSON in data field:", error);
        return next(
          new z.ZodError([
            {
              path: ["body", "data"],
              message: "Invalid JSON in data field",
              code: "custom",
            },
          ]),
        );
      }
    }

    const parsedResult = zodSchema.safeParse(req.body);

    if (!parsedResult.success) {
      console.error(
        "Zod Validation Failed:",
        JSON.stringify(parsedResult.error.format(), null, 2),
      );
      return next(parsedResult.error);
    }

    console.log("Zod Validation Passed.");
    // sanitizing the data
    req.body = parsedResult.data;

    next();
  };
};
