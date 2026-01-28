import { Router } from "express";
import { tutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middlewares/auth";

export const TutorRouter = Router()





TutorRouter.get("/", auth(UserRole.ADMIN), tutorController.getTutors)