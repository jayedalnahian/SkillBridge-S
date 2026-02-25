import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { IndexRouter } from "./app/router/Index.Router";








const app: Application = express();


// Parse cookies
app.use(cookieParser());

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use("/api/auth/*split", toNodeHandler(auth))

app.use("/api/v1", IndexRouter);


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