import { Request, Response, NextFunction } from "express";
import handleStripeWebhookEvent, { createCheckoutSession } from "./payment.service.js";

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
    try {
        const event = req.body;
        const result = await handleStripeWebhookEvent(event);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const PaymentController = {
    createCheckout,
    handleWebhook,
};
