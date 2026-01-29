import { Router } from "express";
import { AvailablityController } from "./availability.controller";
import auth, { UserRole } from "../../middlewares/auth";

export const AvailabilityRouter = Router();




AvailabilityRouter.get("/",
    auth(UserRole.TUTOR),
    AvailablityController.getTutorAvailabilityController
)



AvailabilityRouter.post("/",
    auth(UserRole.TUTOR),
    AvailablityController.createAvailabilityController
)



AvailabilityRouter.delete("/:id",
    auth(UserRole.TUTOR),
    AvailablityController.createAvailabilityController
)



AvailabilityRouter.delete("/:id",
    auth(UserRole.TUTOR),
    AvailablityController.deleteAvailabilityController
);