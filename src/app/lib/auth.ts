import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { UserRole, UserStatus } from "../generated/prisma";

import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import { googleLoginHealpers } from "../healpers/googleLoginHealper";
import { envVars } from "../config/env";
// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: async (profile: any) => {
        const existingUser = await googleLoginHealpers(profile);

        // If user exists, return their specific data
        if (existingUser) {
          return {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            status: existingUser.status,
            emailVerified: true,
          };
        }

        // If user is new, return default Student configuration
        // Better Auth will handle the creation in the database
        return {
          email: profile.email,
          name: profile.name,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        };
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT,
      },

      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },

      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
      needPasswordChange: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
    },
  },
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[auth.ts] Starting ${type} for email: ${email}`);

        // Retry logic to handle race conditions where the user might not be immediately visible
        let user = null;
        for (let i = 0; i < 3; i++) {
          user = await prisma.user.findUnique({
            where: { email },
          });
          if (user) break;
          console.log(
            `[auth.ts] User not found, retrying lookup (${i + 1}/3)...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 500)); // wait 500ms
        }

        if (type === "email-verification") {
          if (!user) {
            console.error(
              `[auth.ts] User with email ${email} not found after retries. Cannot send verification OTP.`,
            );
            return;
          }

          if (user.role === UserRole.ADMIN) {
            console.log(
              `[auth.ts] User ${email} is a admin. Skipping sending verification OTP.`,
            );
            return;
          }

          if (!user.emailVerified) {
            console.log(`[auth.ts] Sending verification email to ${email}...`);
            try {
              await sendEmail({
                to: email,
                subject: "Verify your email",
                templateName: "otp",
                templateData: {
                  name: user.name,
                  otp,
                },
              });
              console.log(`[auth.ts] Verification email sent to ${email}`);
            } catch (error: any) {
              console.error(
                `[auth.ts] Failed to send verification email to ${email}:`,
                error.message,
              );
            }
          } else {
            console.log(
              `[auth.ts] User ${email} already verified. Skipping email.`,
            );
          }
        } else if (type === "forget-password") {
          if (user) {
            console.log(
              `[auth.ts] Sending forget-password email to ${email}...`,
            );
            try {
              await sendEmail({
                to: email,
                subject: "Password Reset OTP",
                templateName: "otp",
                templateData: {
                  name: user.name,
                  otp,
                },
              });
              console.log(`[auth.ts] Forget-password email sent to ${email}`);
            } catch (error: any) {
              console.error(
                `[auth.ts] Failed to send forget-password email to ${email}:`,
                error.message,
              );
            }
          } else {
            console.error(
              `[auth.ts] User with email ${email} not found for forget-password.`,
            );
          }
        }
      },
      expiresIn: 2 * 60, // 2 minutes in seconds
      otpLength: 6,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
    },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:5000",
    envVars.FRONTEND_URL,
  ],

  advanced: {
    disableCSRFCheck: true,
    disableOriginCheck: true,
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
