import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../../config/env";
// If your Prisma file is located elsewhere, you can change the path



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: UserRole.STUDENT
            },

            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE
            },
            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000", envVars.FRONTEND_URL],
    plugins: [
        
    ]
});