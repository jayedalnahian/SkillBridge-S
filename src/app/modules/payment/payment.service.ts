import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import { PaymentStatus } from "../../generated/prisma/client.js";
import { stripe } from "../../config/stripe.config.js";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHalpers/AppError.js";
import status from "http-status";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    const existingPayment = await prisma.payment.findUnique({
        where: {
            id: event.id,
        },
    });

    if (existingPayment) {
        console.log(`Event ${event.id} already processed. Skipping...`);

        return {
            message: `Event ${event.id} already processed. Skipping...`,
        }
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object
            const bookingId = session.metadata?.bookingId
            const paymentId = session.metadata?.paymentId

            if (!bookingId || !paymentId) {
                console.log(`Missing bookingId or paymentId in metadata for event ${event.id}`);
                return {
                    message: `Missing bookingId or paymentId in metadata for event ${event.id}`,
                }
            }

            const booking = await prisma.booking.findUnique({
                where: {
                    id: bookingId,
                },
            });

            if (!booking) {
                console.log(`Booking ${bookingId} not found for event ${event.id}`);
                return {
                    message: `Booking ${bookingId} not found for event ${event.id}`,
                }
            }

            await prisma.$transaction(async (tx: typeof prisma) => {
                await tx.booking.update({
                    where: {
                        id : bookingId
                    },
                    data: {
                        paymentStatus: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                })

                await tx.payment.update({
                    where: {
                        id: paymentId
                    },
                    data: {
                        stripeEventId: event.id,
                        status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData: session,
                    }
                })
            })
            break;


        case 'checkout.session.expired': {
            const expiredSession = event.data.object;
            const expiredPaymentId = expiredSession.metadata?.paymentId;

            if (expiredPaymentId) {
                await prisma.payment.update({
                    where: { id: expiredPaymentId },
                    data: {
                        stripeEventId: event.id,
                        status: PaymentStatus.UNPAID,
                        paymentGatewayData: expiredSession,
                    }
                });
            }
            break;
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const intentPaymentId = paymentIntent.metadata?.paymentId;

            if (intentPaymentId) {
                await prisma.$transaction(async (tx: typeof prisma) => {
                    await tx.payment.update({
                        where: { id: intentPaymentId },
                        data: {
                            stripeEventId: event.id,
                            status: PaymentStatus.PAID,
                            paymentGatewayData: paymentIntent,
                        }
                    });

                    const payment = await tx.payment.findUnique({
                        where: { id: intentPaymentId },
                        select: { bookingId: true }
                    });

                    if (payment?.bookingId) {
                        await tx.booking.update({
                            where: { id: payment.bookingId },
                            data: { paymentStatus: PaymentStatus.PAID }
                        });
                    }
                });
            }
            break;
        }
        case 'payment_intent.payment_failed': {
            const failedIntent = event.data.object;
            const failedPaymentId = failedIntent.metadata?.paymentId;

            if (failedPaymentId) {
                await prisma.payment.update({
                    where: { id: failedPaymentId },
                    data: {
                        stripeEventId: event.id,
                        status: PaymentStatus.UNPAID,
                        paymentGatewayData: failedIntent,
                    }
                });
            }
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return {
        message: `Event ${event.id} processed successfully`,
    };
};

const createCheckoutSession = async (bookingId: string, userId: string) => {
    // 1. Get booking with payment details
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            payment: true,
            Student: {
                include: {
                    User: true
                }
            },
            Tutor: {
                include: {
                    User: true
                }
            }
        }
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if (!booking.payment) {
        throw new AppError(status.NOT_FOUND, "Payment record not found for this booking");
    }

    // 2. Verify the booking belongs to the requesting user
    if (booking.Student.User.id !== userId) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to pay for this booking");
    }

    // 3. Check if already paid
    if (booking.payment.status === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "This booking has already been paid");
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Tutoring Session with ${booking.Tutor.User.name || booking.Tutor.User.email}`,
                    description: `Booking ID: ${booking.id}\nDate: ${booking.startDateTime.toISOString()}`
                },
                unit_amount: Math.round(booking.price * 100), // Convert to cents
            },
            quantity: 1,
        }],
        metadata: {
            bookingId: booking.id,
            paymentId: booking.payment.id,
        },
        success_url: `${envVars.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${envVars.FRONTEND_URL}/payment/cancel?booking_id=${booking.id}`,
    });

    return { checkoutUrl: session.url, sessionId: session.id };
};

export { createCheckoutSession };
export default handleStripeWebhookEvent;