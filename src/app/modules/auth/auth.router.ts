import { Router } from "express";

import {
  forgetPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resendOTPSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/register",
  multerUpload.single("file"),
  validateRequest(registerUserSchema),
  AuthController.registerUser,
);
router.post(
  "/login",
  validateRequest(loginUserSchema),
  AuthController.loginUser,
);
router.post(
  "/logout",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  AuthController.logoutUser,
);

router.post(
  "/refresh-token",
  AuthController.getNewToken
);

router.post(
  "/change-password",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  AuthController.changePassword,
);

router.get(
  "/me",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  AuthController.getMe,
);

router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  AuthController.verifyEmail,
);
router.post(
  "/resend-otp",
  validateRequest(resendOTPSchema),
  AuthController.resendVerificationOTP,
);
router.post(
  "/forget-password",
  validateRequest(forgetPasswordSchema),
  AuthController.forgetPassword,
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword,
);

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRouter = router;
