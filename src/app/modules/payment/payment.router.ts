import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../generated/prisma/client.js";

const router = Router();

// Create Stripe checkout session (protected route - only students can pay)
router.post("/create-checkout-session", checkAuth(UserRole.STUDENT), PaymentController.createCheckout);

export const PaymentRouter = router;
