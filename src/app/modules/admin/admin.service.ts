import status from "http-status";
import type { Admin, Prisma } from "../../generated/prisma/client.js";
import prismaClientPkg from "../../generated/prisma/client.js";
import prismaPkg from "../../generated/prisma/index.js";
import AppError from "../../errorHalpers/AppError.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
  adminFilterableFields,
  adminSearchableFields,
} from "./admin.constent.js";
import { IAdminPayload, IAdminUpdatePayload } from "./admin.type.js";
import type { UserRole as TUserRole } from "../../generated/prisma/index.js";

const { UserRole } = prismaClientPkg as any;
const { UserStatus } = prismaPkg as any;

const getAllAdmins = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Admin,
    Prisma.AdminWhereInput,
    Prisma.AdminInclude
  >(prisma.admin, query, {
    searchableFields: adminSearchableFields,
    filterableFields: adminFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();

  return result;
};

const getSingleAdmin = async (id: string) => {
  // Validate ID format
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid admin ID provided");
  }

  const admin = await prisma.admin.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  if (admin.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  // Remove sensitive fields from response
  const { isDeleted, deletedAt, ...adminData } = admin;

  return adminData;
};

const createAdmin = async (payload: IAdminPayload) => {
  // Check if user with this email already exists
  const userExists = await prisma.user.findUnique({
    where: {
      email: payload.admin.email,
    },
  });

  if (userExists) {
    throw new AppError(
      status.FORBIDDEN,
      "User with this email already exists.",
    );
  }

  // Register user via auth API
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.admin.email,
      name: payload.admin.name,
      password: payload.password,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      image: payload.admin.profilePhoto,
    } as any,
  });

  try {
    // Create admin record in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const adminData = await tx.admin.create({
        data: {
          ...payload.admin,
          userId: userData.user.id,
        },
      });

      const admin = await tx.admin.findUnique({
        where: {
          id: adminData.id,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              emailVerified: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return admin;
    });

    return result;
  } catch (error) {
    // Cleanup: delete the created user if admin creation fails
    await prisma.user.delete({
      where: { id: userData.user.id },
    }).catch(() => {
      // Ignore cleanup errors
    });

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to create admin. Please try again.",
    );
  }
};

const updateAdmin = async (
  id: string,
  userId: string,
  payload: IAdminUpdatePayload,
  role: TUserRole,
) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid admin ID provided");
  }

  const admin = await prisma.admin.findUnique({
    where: { id, isDeleted: false },
    include: { User: true },
  });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  // Admins can only update their own data, not other admins
  if (admin.User.id !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to update another admin's profile",
    );
  }

  // Check email uniqueness if email is being updated
  if (payload.email && payload.email !== admin.email) {
    const emailExists = await prisma.admin.findUnique({
      where: { email: payload.email },
    });
    if (emailExists) {
      throw new AppError(
        status.FORBIDDEN,
        "Email already in use by another admin",
      );
    }
  }

  // Perform update in transaction - sync with User table
  const result = await prisma.$transaction(async (tx: any) => {
    // Update admin record
    const updatedAdmin = await tx.admin.update({
      where: { id },
      data: payload,
    });

    // Sync name and email with User table if they changed
    const userUpdateData: any = {};
    if (payload.name) userUpdateData.name = payload.name;
    if (payload.email) userUpdateData.email = payload.email;

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: admin.userId },
        data: userUpdateData,
      });
    }

    // Return updated admin with User relation
    const adminWithUser = await tx.admin.findUnique({
      where: { id: updatedAdmin.id },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            emailVerified: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return adminWithUser;
  });

  // Remove sensitive fields
  const { isDeleted, deletedAt, ...adminData } = result;
  return adminData;
};

const hardDeleteAdmin = async (id: string, currentUserId: string) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid admin ID provided");
  }

  const admin = await prisma.admin.findUnique({
    where: { id },
    include: { User: true },
  });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  // Prevent self-deletion
  if (admin.User.id === currentUserId) {
    throw new AppError(
      status.FORBIDDEN,
      "You cannot delete your own admin account",
    );
  }

  // Permanent delete in transaction
  const result = await prisma.$transaction(async (tx: any) => {
    // Delete admin first (cascades via onDelete: Cascade if configured)
    await tx.admin.delete({
      where: { id },
    });

    // Delete the associated user account
    await tx.user.delete({
      where: { id: admin.userId },
    });

    return { id, message: "Admin permanently deleted" };
  });

  return result;
};

export const adminService = {
  getAllAdmins,
  getSingleAdmin,
  createAdmin,
  updateAdmin,
  hardDeleteAdmin,
};
