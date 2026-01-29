import { Router } from "express";
import { tutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middlewares/auth";

export const TutorRouter = Router()





TutorRouter.get("/", auth(UserRole.ADMIN), tutorController.getTutors)
TutorRouter.post("/apply", auth(UserRole.STUDENT), tutorController.applyForTutor)
TutorRouter.get("/application-status", auth(UserRole.STUDENT, UserRole.TUTOR), tutorController.getTutorApplicationStatus)
TutorRouter.put("/profile", auth(UserRole.TUTOR), tutorController.updateTutorProfile)
TutorRouter.patch("/:id/approve", auth(UserRole.ADMIN), tutorController.approveTutor)
