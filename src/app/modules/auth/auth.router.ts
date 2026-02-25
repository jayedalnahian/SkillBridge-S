import { Router } from "express"
import { multerUpload } from "../../../config/multer.config"
import { validateReauest } from "../../../middleware/validateRequest"
import { loginUserSchema, registerUserSchema } from "./auth.validation"
import { AuthController } from "./auth.controller"
import { checkAuth } from "../../../middleware/checkAuth"
import { UserRole } from "../../../generated/prisma/enums"

const router = Router()

router.post('/register', multerUpload.single("file"), validateReauest(registerUserSchema), AuthController.registerUser);
router.post('/login', validateReauest(loginUserSchema), AuthController.loginUser);
router.post("/logout", checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), AuthController.logoutUser)
router.get("/me", checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), AuthController.getMe)

export const AuthRouter = router