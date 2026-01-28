import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { User } from "../../generated/prisma/client";

// If your Prisma file is located elsewhere, you can change the path



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true
    },
    // events: {
    //     async onUserCreated({ user }: { user: User }) {
    //         console.log("🔥 onUserCreated fired for:", user.email);
    //         await prisma.userProfile.create({
    //             data: {
    //                 userId: user.id,
    //                 role: "STUDENT",      // default role
    //                 status: "ACTIVE",
    //             },
    //         });
    //     }
    // },
    trustedOrigins: [
        "http://localhost:4000", // frontend
        "http://localhost:3000", // backend (optional but safe)
    ],
});