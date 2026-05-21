import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import handleStripeWebhookEvent, { createCheckoutSession } from "./payment.service.js";
import { stripe } from "../../config/stripe.config.js";
import { envVars } from "../../config/env.js";

const createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user?.userId; // Assumes auth middleware sets req.user

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const result = await createCheckoutSession(bookingId, userId);

        res.status(200).json({
            success: true,
            message: "Checkout session created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[Webhook] Received request at ${new Date().toISOString()}`);
    console.log(`[Webhook] Headers:`, req.headers["stripe-signature"] ? "Has signature" : "No signature");
    
    try {
        const sig = req.headers["stripe-signature"] as string;
        const endpointSecret = envVars.STRIPE_WEBHOOK_SECRET;
        console.log(`[Webhook] Endpoint secret configured:`, endpointSecret ? "Yes" : "No");

        let event: any;

        if (endpointSecret) {
            // Verify signature if webhook secret is configured
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // Fallback for development (not recommended for production)
            console.warn("No STRIPE_WEBHOOK_SECRET set, skipping signature verification");
            event = JSON.parse(req.body);
        }

        console.log(`[Webhook] Event constructed: ${event.type} (${event.id})`);
        const result = await handleStripeWebhookEvent(event);
        console.log(`[Webhook] Handler result:`, result);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("[Webhook] Error:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required",
            });
        }

        console.log(`[VerifyPayment] Checking session: ${sessionId}`);

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log(`[VerifyPayment] Session status: ${session.payment_status}`);

        if (session.payment_status === "paid") {
            // Create a mock checkout.session.completed event
            const mockEvent: any = {
                id: `manual_${Date.now()}`,
                object: "event",
                api_version: "2024-12-18.acacia",
                created: Math.floor(Date.now() / 1000),
                livemode: false,
                pending_webhooks: 0,
                request: { id: null, idempotency_key: null },
                type: "checkout.session.completed",
                data: { object: session },
            };

            const result = await handleStripeWebhookEvent(mockEvent as any);
            
            return res.status(200).json({
                success: true,
                message: "Payment verified and updated",
                data: result,
            });
        } else {
            return res.status(200).json({
                success: false,
                message: `Payment status: ${session.payment_status}`,
                data: { status: session.payment_status },
            });
        }
    } catch (error: any) {
        console.error("[VerifyPayment] Error:", error.message);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const PaymentController = {
    createCheckout,
    handleWebhook,
    verifyPayment,
};
