import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";

const router = Router();

// Create Stripe checkout session (protected route - only students can pay)
router.post("/create-checkout-session", checkAuth(UserRole.STUDENT), PaymentController.createCheckout);

// Manually verify payment status (for when webhooks aren't available)
router.post("/verify-payment", checkAuth(UserRole.STUDENT), PaymentController.verifyPayment);

export const PaymentRouter = router;
