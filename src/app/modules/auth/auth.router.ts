import { Router } from "express";

import {
  forgetPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resendOTPSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation.js";
import { AuthController } from "./auth.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import prismaPkg from "../../generated/prisma/index.js";
// import { multerUpload } from "../../config/multer.config.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const { UserRole } = prismaPkg as any;

const router = Router();

router.post(
  "/register",
  // multerUpload.single("file"),
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
// localhost: 3000/auth/login/google
router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRouter = router;
