import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { IndexRouter } from "./app/router/Index.Router";
import notFound from "./app/middleware/notFound";
import { envVars } from "./app/config/env";
import cors from "cors";
import { PaymentController } from "./app/modules/payment/payment.controller";
import qs from "qs";
import path from "path";


const app: Application = express();

app.set("query parser", (str : string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views",path.resolve(process.cwd(), `src/app/templates`) )

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

app.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent)


app.use(cors({
    origin : [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL, "http://localhost:3000", "http://localhost:5000", "http://localhost:5050"],
    credentials : true,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders : ["Content-Type", "Authorization"]
}))
app.all("/api/auth/*splat", toNodeHandler(auth));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));



app.use("/api/v1", IndexRouter);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    message: "Hello World!",
  });
});

app.use(globalErrorHandler);
app.use(notFound);
export default app;
