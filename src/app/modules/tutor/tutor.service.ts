import status from "http-status";
import AppError from "../../errorHalpers/AppError";
import {
  BookingStatus,
  Category,
  Prisma,
  Tutor,
  UserRole,
} from "../../generated/prisma/client";
import { IQueryParams } from "../../interface/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  tutorFilterableFields,
  tutorIncludeConfig,
  tutorSearchableFields,
} from "./tutor.constent";
import { ITutorPayload, ITutorUpdatePayload } from "./tutor.type";
import { auth } from "../../lib/auth";

const getAllTutors = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Tutor,
    Prisma.TutorWhereInput,
    Prisma.TutorInclude
  >(prisma.tutor, query, {
    searchableFields: tutorSearchableFields,
    filterableFields: tutorFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({ isDeleted: false }) // soft delete protection
    .sort()
    .paginate()
    .fields()
    .dynamicInclude(tutorIncludeConfig)
    .execute();

  return result;
};

const getSingleTutor = async (id: string) => {
  const result = await prisma.tutor.findUnique({
    where: { id, isDeleted: false },
    include: tutorIncludeConfig,
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  return result;
};

const createTutor = async (payload: ITutorPayload) => {
  // Deduplicate category IDs
  const uniqueCategoryIds = [...new Set(payload.categories)];

  const categories: Category[] = [];

  for (const categoryId of uniqueCategoryIds) {
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
        isDeleted: false,
      },
    });

    if (!category) {
      throw new AppError(
        status.BAD_REQUEST,
        `Category with id ${categoryId} not found or has been deleted.`,
      );
    }
    categories.push(category);
  }

  // Validate availability times
  const { availabilityStartTime, availabilityEndTime } = payload.tutor;
  if (availabilityStartTime >= availabilityEndTime) {
    throw new AppError(
      status.BAD_REQUEST,
      "Availability start time must be before end time.",
    );
  }

  const userExists = await prisma.user.findUnique({
    where: {
      email: payload.tutor.email,
    },
  });

  if (userExists) {
    throw new AppError(
      status.FORBIDDEN,
      "User with this email already exists.",
    );
  }

  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.tutor.email,
      name: payload.tutor.name,
      password: payload.password,
      role: UserRole.TUTOR,
      // image: profilePhoto,
    },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { availabilityStartTime, availabilityEndTime, ...otherTutorData } =
        payload.tutor;
      const today = new Date().toISOString().split("T")[0]; // "2026-02-25"

      const startDateTime = new Date(`${today}T${availabilityStartTime}:00`);
      const endDateTime = new Date(`${today}T${availabilityEndTime}:00`);
      const tutorData = await tx.tutor.create({
        data: {
          ...otherTutorData,
          userId: userData.user.id,
          availabilityStartTime: startDateTime,
          availabilityEndTime: endDateTime,
        },
      });

      const tutorCategoryData = categories.map((category) => {
        return {
          tutorId: tutorData.id,
          categoryId: category.id,
        };
      });

      await tx.tutorCategory.createMany({
        data: tutorCategoryData,
      });

      const tutor = await tx.tutor.findUnique({
        where: {
          id: tutorData.id,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          educationLevel: true,
          experienceYears: true,
          hourlyRate: true,
          availableDays: true,
          availabilityStartTime: true,
          availabilityEndTime: true,
          tutorCategory: {
            select: {
              categoryId: true,
            },
          },

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
              isDeleted: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return tutor;
    });
    return result;
  } catch (error) {
    console.log("Transaction error: ", error);
    await prisma.user.delete({
      where: {
        id: userData.user.id,
      },
    });

    throw error;
  }
};

const updateTutor = async (
  tutorId: string,
  userId: string,
  payload: ITutorUpdatePayload,
  role: UserRole,
) => {
  const tutor = await prisma.tutor.findUnique({
    where: {
      id: tutorId,
    },
    include: {
      User: true,
    },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  // Prevent updating a soft-deleted tutor
  if (tutor.isDeleted) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot update a deleted tutor profile.",
    );
  }

  // Allow if the user is the tutor owner OR an admin
  if (tutor.User.id !== userId && role !== UserRole.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to update tutor's profile.",
    );
  }

  // Only admins can update hourly rate
  if (payload.hourlyRate !== undefined && role !== UserRole.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to update tutor's hourly rate.",
    );
  }

  if (payload.hourlyRate !== undefined && payload.hourlyRate < 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Hourly rate must be a positive number.",
    );
  }

  const result = await prisma.tutor.update({
    where: {
      id: tutorId,
    },
    data: payload,
  });

  return result;
};

const deleteTutor = async (id: string) => {
  const tutor = await prisma.tutor.findUnique({
    where: {
      id,
    },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  if (tutor.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Tutor is already deleted.");
  }

  // FIX: Use `in` operator — the `||` expression always evaluates to just "ACCEPTED"
  const tutorIsBooked = await prisma.booking.findFirst({
    where: {
      tutorId: id,
      status: {
        in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
      },
    },
  });

  if (tutorIsBooked) {
    throw new AppError(
      status.BAD_REQUEST,
      "Tutor has active or pending bookings and cannot be deleted.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedTutor = await tx.tutor.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: {
        id: tutor.userId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedTutor;
  });

  return result;
};

export const TutorService = {
  getAllTutors,
  getSingleTutor,
  createTutor,
  updateTutor,
  deleteTutor,
};
