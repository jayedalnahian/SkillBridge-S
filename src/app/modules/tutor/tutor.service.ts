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
    .sort()
    .paginate()
    .fields()
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
      const today = new Date().toISOString().split("T")[0];
    

      // Parse time components and create Date using UTC to preserve the intended time
      const [startHours, startMinutes] = availabilityStartTime.split(":").map(Number);
      const [endHours, endMinutes] = availabilityEndTime.split(":").map(Number);
      console.log("today", today);
      console.log("availabilityStartTime", availabilityStartTime);
      console.log("availabilityEndTime", availabilityEndTime);
      console.log("startHours", startHours);
      console.log("startMinutes", startMinutes);
      console.log("endHours", endHours);
      console.log("endMinutes", endMinutes);
      const startDateTime = new Date(Date.UTC(
        parseInt(today.split("-")[0]),
        parseInt(today.split("-")[1]) - 1,
        parseInt(today.split("-")[2]),
        startHours,
        startMinutes
      ));
      const endDateTime = new Date(Date.UTC(
        parseInt(today.split("-")[0]),
        parseInt(today.split("-")[1]) - 1,
        parseInt(today.split("-")[2]),
        endHours,
        endMinutes
      ));
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

const getAssignedCategories = async (tutorId: string) => {
  const tutorCategories = await prisma.tutorCategory.findMany({
    where: {
      tutorId,
    },
    include: {
      Category: true,
    },
  });

  return tutorCategories.map((tc) => tc.Category);
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

const bulkSoftDeleteTutors = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    throw new AppError(status.BAD_REQUEST, "No tutor IDs provided");
  }

  const results = {
    deleted: [] as string[],
    notFound: [] as string[],
    alreadyDeleted: [] as string[],
    hasBookings: [] as string[],
    errors: [] as { id: string; message: string }[],
  };

  for (const id of ids) {
    try {
      const tutor = await prisma.tutor.findUnique({
        where: { id },
      });

      if (!tutor) {
        results.notFound.push(id);
        continue;
      }

      // Skip if already deleted
      if (tutor.isDeleted) {
        results.alreadyDeleted.push(id);
        continue;
      }

      // Check for active or pending bookings
      const tutorHasBookings = await prisma.booking.findFirst({
        where: {
          tutorId: id,
          status: {
            in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
          },
        },
      });

      if (tutorHasBookings) {
        results.hasBookings.push(id);
        continue;
      }

      // Soft delete tutor and associated user in transaction
      await prisma.$transaction(async (tx) => {
        await tx.tutor.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: tutor.userId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      });

      results.deleted.push(id);
    } catch (error: any) {
      results.errors.push({ id, message: error.message || "Unknown error" });
    }
  }

  // If nothing was deleted and there were issues, throw an error
  if (
    results.deleted.length === 0 &&
    (results.notFound.length > 0 ||
      results.hasBookings.length > 0 ||
      results.alreadyDeleted.length > 0 ||
      results.errors.length > 0)
  ) {
    const messages: string[] = [];
    if (results.notFound.length > 0) {
      messages.push(`${results.notFound.length} tutor(s) not found`);
    }
    if (results.hasBookings.length > 0) {
      messages.push(`${results.hasBookings.length} tutor(s) have active/pending bookings`);
    }
    if (results.alreadyDeleted.length > 0) {
      messages.push(`${results.alreadyDeleted.length} tutor(s) already deleted`);
    }
    if (results.errors.length > 0) {
      messages.push(`${results.errors.length} tutor(s) failed to delete`);
    }
    throw new AppError(status.BAD_REQUEST, messages.join("; "));
  }
  console.log(results)
  return results;
};

const restoreTutor = async (id: string) => {
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: { User: true },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  if (!tutor.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Tutor is not deleted.");
  }

  // Check for email conflicts with active tutors
  const emailConflict = await prisma.tutor.findFirst({
    where: {
      email: tutor.email,
      isDeleted: false,
      id: { not: id },
    },
  });
  if (emailConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active tutor with email "${tutor.email}" already exists`,
    );
  }

  // Check for contact number conflicts with active tutors
  const contactConflict = await prisma.tutor.findFirst({
    where: {
      contactNumber: tutor.contactNumber,
      isDeleted: false,
      id: { not: id },
    },
  });
  if (contactConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active tutor with contact number "${tutor.contactNumber}" already exists`,
    );
  }

  // Check for user email conflicts
  const userEmailConflict = await prisma.user.findFirst({
    where: {
      email: tutor.User.email,
      isDeleted: false,
      id: { not: tutor.userId },
    },
  });
  if (userEmailConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active user with email "${tutor.User.email}" already exists`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const restoredTutor = await tx.tutor.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await tx.user.update({
      where: { id: tutor.userId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return restoredTutor;
  });

  return result;
};

const hardDeleteTutor = async (id: string) => {
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: {
      User: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
          },
        },
      },
    },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  // Only allow hard delete if tutor is soft-deleted
  if (!tutor.isDeleted) {
    throw new AppError(
      status.BAD_REQUEST,
      "Tutor must be soft-deleted before permanent deletion.",
    );
  }

  // Check for active bookings
  if (tutor.bookings.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot permanently delete tutor with active or pending bookings.",
    );
  }

  // Permanent delete - Prisma will handle related data via Cascade
  const result = await prisma.$transaction(async (tx) => {
    // Delete tutor first (this will cascade delete tutorCategory, reviews, bookings via onDelete: Cascade)
    await tx.tutor.delete({
      where: { id },
    });

    // Delete the associated user account
    await tx.user.delete({
      where: { id: tutor.userId },
    });

    return { id, message: "Tutor permanently deleted" };
  });

  return result;
};




export const TutorService = {
  bulkSoftDeleteTutors,
  getAllTutors,
  getSingleTutor,
  getAssignedCategories,
  createTutor,
  updateTutor,
  restoreTutor,
  hardDeleteTutor,
};
