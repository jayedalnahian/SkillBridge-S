import express, { Application, Request, Response } from "express";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";








const app: Application = express();
app.use("/api/auth/*split", toNodeHandler(auth))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', async (req: Request, res: Response) => {
    res.status(201).json({
        success: true,
        message: 'Hello World!',
    })
});


app.use(globalErrorHandler)
app.use(notFound)
export default app;