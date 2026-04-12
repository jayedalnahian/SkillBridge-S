import { prisma } from "../lib/prisma.js";
import prismaPkg from "../generated/prisma/index.js";

const { UserStatus } = prismaPkg;

export const googleLoginHealpers = async (profile: any) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: profile.email,
    },
  });

  if (!existingUser) {
    // If user doesn't exist, we return null so the auth config can handle it as a new student
    console.log(`[GoogleLoginHelper] User ${profile.email} not found. Preparing for auto-registration.`);
    return null;
  }

  if (existingUser.status !== UserStatus.ACTIVE) {
    throw new Error("User is not active");
  }

  if (existingUser.isDeleted) {
    throw new Error("User is deleted");
  }

  return {
    id: existingUser.id,
    email: existingUser.email,
    role: existingUser.role,
    status: existingUser.status,
    emailVerified: true,
  };
};
