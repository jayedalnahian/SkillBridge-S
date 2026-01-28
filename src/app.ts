import express, { Application } from "express"
import cors from 'cors'
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { AuthRouter } from "./modules/auth/auth.routes";
import { CategoryRouter } from "./modules/category/category.routes";
import { UserRouter } from "./modules/user/user.routes";
import { TutorRouter } from "./modules/tutor/tutor.routes";
const app: Application = express()


app.use(cors({
    origin: process.env.APP_URL || "http://localhost:4000", // client side url
    credentials: true
}))

app.use(express.json());

app.use("/api/v1/auth", AuthRouter)
app.use("/api/v1/categories", CategoryRouter)
app.use("/api/v1/users", UserRouter)
app.use("/api/v1/tutors", TutorRouter)

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
    res.status(200).json({
        message: "hello from skillBridge"
    })
})

export default app;