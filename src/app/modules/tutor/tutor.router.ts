import { Router } from "express"
import { TutorController } from "./tutor.controller"
import { checkAuth } from "../../../middleware/checkAuth"
import { UserRole } from "../../../generated/prisma/enums"
import { validateReauest } from "../../../middleware/validateRequest"
import { createTutorSchema, updateTutorSchema } from "./tutor.validate"
import { multerUpload } from "../../../config/multer.config"






const router = Router()


router.get("/", TutorController.getAllTutors)
router.get("/:id", TutorController.getSingleTutor)
router.post("/", multerUpload.single("file"), checkAuth(UserRole.ADMIN), validateReauest(createTutorSchema), TutorController.createTutor)
router.patch("/:id", checkAuth(UserRole.ADMIN, UserRole.TUTOR), validateReauest(updateTutorSchema), TutorController.updateTutor)






export const TutorRouter = router