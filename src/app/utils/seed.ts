
import { UserRole } from "../generated/prisma";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { envVars } from "../config/env";

export const seedAdmin = async () => {
  const adminEmail = envVars.ADMIN_EMAIL;
  try {
    // 1. Check if ANY user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    // 2. If user exists and is already SUPER_ADMIN, check if Admin profile exists
    if (existingUser && existingUser.role === UserRole.ADMIN) {
      const adminProfile = await prisma.admin.findUnique({
        where: { userId: existingUser.id },
      });
      if (adminProfile) {
        console.log(
          "Super admin already exists with profile. Skipping seeding.",
        );
        return;
      }
    }

    let userId: string;

    if (!existingUser) {
      console.log("Creating new super admin user...");
      const signUpResponse = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: envVars.ADMIN_PASSWORD,
          name: "Super Admin",
          role: UserRole.ADMIN,
          needPasswordChange: false,
          rememberMe: false,
        },
      });

      if (!signUpResponse || !signUpResponse.user) {
        throw new Error("Failed to create super admin user via auth.api");
      }
      userId = signUpResponse.user.id;
    } else {
      console.log("User already exists, updating to SUPER_ADMIN role...");
      userId = existingUser.id;
    }

    // 3. Update User and Create/Update Admin in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          role: UserRole.ADMIN,
          emailVerified: true,
        },
      });

      await tx.admin.upsert({
        where: { userId: userId },
        update: {
          name: "First Admin",
          email: adminEmail,
          profilePhoto: "https://example.com/avatar.png",
          contactNumber: "0000000000",
          address: "Default Address",
        },
        create: {
          userId: userId,
          name: "First Admin",
          email: adminEmail,
          profilePhoto: "https://example.com/avatar.png",
          contactNumber: "0000000000",
          address: "Default Address",
        },
      });
    });

    console.log("First Admin Seeded Successfully");
  } catch (error) {
    console.error("Error seeding first admin: ", error);
    // We avoid deleting the user here to prevent P2003 (Foreign Key constraint violation)
    // and to avoid accidentally deleting a user that might have been partially correctly created.
  }
};
