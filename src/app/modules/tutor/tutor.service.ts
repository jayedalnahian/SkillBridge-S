import status from "http-status";
import AppError from "../../errorHalpers/AppError.js";
import prismaClientPkg from "../../generated/prisma/client.js";
import type { Category, Prisma, Tutor, UserRole as TUserRole } from "../../generated/prisma/client.js";
import prismaPkg from "../../generated/prisma/index.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
  tutorFilterableFields,
  tutorIncludeConfig,
  tutorSearchableFields,
} from "./tutor.constent.js";
import { ITutorPayload, ITutorUpdatePayload } from "./tutor.type.js";
import { auth } from "../../lib/auth.js";

const { BookingStatus, UserRole, TutorStatus } = prismaClientPkg as any;
const { UserStatus } = prismaPkg as any;

const getAllTutors = async (query: IQueryParams) => {
  // Extract availableDays from query for custom handling
  const { availableDays, ...restQuery } = query;

  const queryBuilder = new QueryBuilder<
    Tutor,
    Prisma.TutorWhereInput,
    Prisma.TutorInclude
  >(prisma.tutor, restQuery, {
    searchableFields: tutorSearchableFields,
    filterableFields: tutorFilterableFields,
  });

  // Default filters: exclude soft-deleted and non-active tutors
  queryBuilder.where({
    isDeleted: false,
    status: TutorStatus.ACTIVE,
  } as Prisma.TutorWhereInput);

  // Handle availableDays filter - supports single or multiple days
  if (availableDays) {
    const days = Array.isArray(availableDays)
      ? availableDays
      : [availableDays];

    if (days.length === 1) {
      // Single day: use 'has' operator
      queryBuilder.where({
        availableDays: { has: days[0] },
      } as Prisma.TutorWhereInput);
    } else if (days.length > 1) {
      // Multiple days: tutor must have ALL specified days (AND logic)
      queryBuilder.where({
        availableDays: { hasEvery: days },
      } as Prisma.TutorWhereInput);
    }
  }

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
      status: UserStatus.ACTIVE,
      // image: profilePhoto,
    } as any,
  });

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const { availabilityStartTime, availabilityEndTime, ...otherTutorData } =
        payload.tutor;
      const today = new Date().toISOString().split("T")[0];
    

      // Parse time components and create Date using UTC to preserve the intended time
      const [startHours, startMinutes] = availabilityStartTime.split(":").map(Number);
      const [endHours, endMinutes] = availabilityEndTime.split(":").map(Number);
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

  return tutorCategories.map((tc: any) => tc.Category);
};

const updateTutor = async (
  id: string,
  userId: string,
  payload: ITutorUpdatePayload,
  role: TUserRole,
) => {
  // Extract categories and time fields from payload
  const { categories, availabilityStartTime, availabilityEndTime, ...rest } = payload;

  const tutor = await prisma.tutor.findUnique({
    where: { id, isDeleted: false },
    include: { User: true },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
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

  // Validate and convert availability times to DateTime if provided
  let startDateTime: Date | undefined;
  let endDateTime: Date | undefined;

  if (availabilityStartTime || availabilityEndTime) {
    const currentStartTime = availabilityStartTime
      ? availabilityStartTime
      : tutor.availabilityStartTime.toISOString().slice(11, 16);
    const currentEndTime = availabilityEndTime
      ? availabilityEndTime
      : tutor.availabilityEndTime.toISOString().slice(11, 16);

    // Parse time strings (HH:mm) into DateTime objects using today's date as base
    const today = new Date().toISOString().split("T")[0];
    const [startHours, startMinutes] = currentStartTime.split(":").map(Number);
    const [endHours, endMinutes] = currentEndTime.split(":").map(Number);

    startDateTime = new Date(Date.UTC(
      parseInt(today.split("-")[0]),
      parseInt(today.split("-")[1]) - 1,
      parseInt(today.split("-")[2]),
      startHours,
      startMinutes
    ));
    endDateTime = new Date(Date.UTC(
      parseInt(today.split("-")[0]),
      parseInt(today.split("-")[1]) - 1,
      parseInt(today.split("-")[2]),
      endHours,
      endMinutes
    ));

    // Validate time range
    if (startDateTime >= endDateTime) {
      throw new AppError(
        status.BAD_REQUEST,
        "Availability start time must be before end time.",
      );
    }
  }

  // Build clean update data - only include defined fields
  const updateData: any = {};

  // Add scalar fields from rest (exclude any potential id/userId)
  const { id: _id, userId: _userId, ...safeRest } = rest as any;
  Object.entries(safeRest).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  // Add converted DateTime fields if they were provided
  if (startDateTime) updateData.availabilityStartTime = startDateTime;
  if (endDateTime) updateData.availabilityEndTime = endDateTime;

  // Handle categories update if provided
  if (categories !== undefined) {
    // Verify all category IDs exist
    for (const categoryId of categories) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, isDeleted: false },
      });
      if (!category) {
        throw new AppError(
          status.BAD_REQUEST,
          `Category with id ${categoryId} not found or has been deleted.`,
        );
      }
    }
  }

  // Execute update in transaction to handle both tutor data and category relations
  const result = await prisma.$transaction(async (tx: any) => {
    // Update tutor with clean data
    const updatedTutor = await tx.tutor.update({
      where: { id },
      data: updateData,
    });

    // Update categories if provided
    if (categories !== undefined) {
      // Delete existing category associations
      await tx.tutorCategory.deleteMany({
        where: { tutorId: id },
      });

      // Create new category associations
      if (categories.length > 0) {
        await tx.tutorCategory.createMany({
          data: categories.map((categoryId: string) => ({
            tutorId: id,
            categoryId,
          })),
        });
      }
    }

    return updatedTutor;
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
      await prisma.$transaction(async (tx: any) => {
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

  const result = await prisma.$transaction(async (tx: any) => {
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
  const result = await prisma.$transaction(async (tx: any) => {
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

const getCurrentTutor = async (userId: string) => {
  const tutor = await prisma.tutor.findUnique({
    where: {
      userId
    }
  });

  if (!tutor){
    throw new AppError(status.NOT_FOUND, "Tutor not found");
  }

  return tutor;
};

const getBookingStatusDistribution = async (tutorId: string) => {
  const distribution = await prisma.booking.groupBy({
    by: ["status"],
    where: {
      isDeleted: false,
      tutorId,
    },
    _count: { status: true },
  });

  return distribution.map((item: { status: string; _count: { status: number } }) => ({
    status: item.status,
    count: item._count.status,
  }));
};

const getPaymentStatusDistribution = async (tutorId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
    },
    select: {
      paymentStatus: true,
    },
  });

  const distribution: Record<string, number> = {};
  bookings.forEach((booking: { paymentStatus: string }) => {
    distribution[booking.paymentStatus] = (distribution[booking.paymentStatus] || 0) + 1;
  });

  return Object.entries(distribution).map(([status, count]) => ({
    status,
    count,
  }));
};

const getRatingDistribution = async (tutorId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      isDeleted: false,
      tutorId,
    },
    select: {
      rating: true,
    },
  });

  const distribution: Record<number, number> = {};
  reviews.forEach((review: { rating: number }) => {
    const roundedRating = Math.round(review.rating);
    distribution[roundedRating] = (distribution[roundedRating] || 0) + 1;
  });

  return Object.entries(distribution)
    .map(([rating, count]) => ({ rating: parseInt(rating), count }))
    .sort((a, b) => b.rating - a.rating);
};

const getMonthlyBookings = async (tutorId: string) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      createdAt: true,
    },
  });

  const monthlyData: Record<string, number> = {};
  bookings.forEach((booking: { createdAt: Date }) => {
    const monthKey = booking.createdAt.toISOString().slice(0, 7);
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .map(([month, bookings]) => ({ month, bookings }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const getMonthlyEarnings = async (tutorId: string) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      paymentStatus: "PAID",
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    include: {
      payment: true,
    },
  });

  const monthlyData: Record<string, number> = {};
  bookings.forEach((booking: { createdAt: Date; payment: { amount: number } | null }) => {
    if (booking.payment) {
      const monthKey = booking.createdAt.toISOString().slice(0, 7);
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + booking.payment.amount;
    }
  });

  return Object.entries(monthlyData)
    .map(([month, earnings]) => ({ month, earnings }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const getSessionTimeline = async (tutorId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  const dailyData: Record<string, { completed: number; upcoming: number }> = {};
  bookings.forEach((booking: { createdAt: Date; status: string }) => {
    const dateKey = booking.createdAt.toISOString().slice(0, 10);
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { completed: 0, upcoming: 0 };
    }
    if (booking.status === "COMPLETED") {
      dailyData[dateKey].completed++;
    } else if (["PENDING", "ACCEPTED"].includes(booking.status)) {
      dailyData[dateKey].upcoming++;
    }
  });

  return Object.entries(dailyData)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getUpcomingSessions = async (tutorId: string) => {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      status: { in: ["PENDING", "ACCEPTED"] },
      startDateTime: {
        gte: now,
      },
    },
    orderBy: {
      startDateTime: "asc",
    },
    take: 5,
    include: {
      Student: {
        select: {
          name: true,
        },
      },
    },
  });

  return bookings.map((booking: {
    id: string;
    Student: { name: string };
    startDateTime: Date;
    duration: number;
    meetingLink: string | null;
  }) => ({
    id: booking.id,
    studentName: booking.Student.name,
    subject: "Tutoring Session",
    startDateTime: booking.startDateTime.toISOString(),
    duration: booking.duration,
    meetingLink: booking.meetingLink,
  }));
};

const getTopStudents = async (tutorId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      status: "COMPLETED",
      paymentStatus: "PAID",
    },
    include: {
      Student: {
        select: {
          id: true,
          name: true,
        },
      },
      payment: true,
    },
  });

  const studentStats: Record<string, {
    id: string;
    name: string;
    totalSessions: number;
    totalPaid: number;
  }> = {};

  bookings.forEach((booking: {
    Student: { id: string; name: string };
    payment: { amount: number } | null;
  }) => {
    const studentId = booking.Student.id;
    if (!studentStats[studentId]) {
      studentStats[studentId] = {
        id: studentId,
        name: booking.Student.name,
        totalSessions: 0,
        totalPaid: 0,
      };
    }
    studentStats[studentId].totalSessions++;
    if (booking.payment) {
      studentStats[studentId].totalPaid += booking.payment.amount;
    }
  });

  return Object.values(studentStats)
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 5);
};

const getTutorStats = async (tutorId: string) => {
  const [
    totalBookings,
    completedBookings,
    upcomingBookings,
    reviews,
    uniqueStudents,
    totalHours,
    tutor,
  ] = await Promise.all([
    prisma.booking.count({
      where: { isDeleted: false, tutorId },
    }),
    prisma.booking.count({
      where: { isDeleted: false, tutorId, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: {
        isDeleted: false,
        tutorId,
        status: { in: ["PENDING", "ACCEPTED"] },
        startDateTime: { gte: new Date() },
      },
    }),
    prisma.review.findMany({
      where: { isDeleted: false, tutorId },
      select: { rating: true },
    }),
    prisma.booking.groupBy({
      by: ["studentId"],
      where: { isDeleted: false, tutorId },
      _count: { studentId: true },
    }),
    prisma.booking.aggregate({
      where: { isDeleted: false, tutorId, status: "COMPLETED" },
      _sum: { duration: true },
    }),
    prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { hourlyRate: true },
    }),
  ]);

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
    : null;

  const bookingsWithPayments = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      tutorId,
      paymentStatus: "PAID",
    },
    include: {
      payment: true,
    },
  });

  const totalEarnings = bookingsWithPayments.reduce(
    (sum: number, b: { payment: { amount: number } | null }) => sum + (b.payment?.amount || 0),
    0
  );

  return {
    totalBookings,
    completedSessions: completedBookings,
    upcomingSessions: upcomingBookings,
    totalEarnings,
    averageRating,
    totalReviews,
    uniqueStudents: uniqueStudents.length,
    totalHoursTaught: totalHours._sum.duration || 0,
    hourlyRate: tutor?.hourlyRate || 0,
  };
};

const getDashboardData = async (userId: string) => {
  const currentTutor = await getCurrentTutor(userId);

  const [
    bookingStatusDistribution,
    paymentStatusDistribution,
    ratingDistribution,
    monthlyBookings,
    monthlyEarnings,
    sessionTimeline,
    upcomingSessions,
    topStudents,
    stats,
  ] = await Promise.all([
    getBookingStatusDistribution(currentTutor.id),
    getPaymentStatusDistribution(currentTutor.id),
    getRatingDistribution(currentTutor.id),
    getMonthlyBookings(currentTutor.id),
    getMonthlyEarnings(currentTutor.id),
    getSessionTimeline(currentTutor.id),
    getUpcomingSessions(currentTutor.id),
    getTopStudents(currentTutor.id),
    getTutorStats(currentTutor.id),
  ]);

  return {
    pieCharts: {
      bookingStatusDistribution,
      paymentStatusDistribution,
      ratingDistribution,
    },
    barCharts: {
      monthlyBookings,
      monthlyEarnings,
    },
    lineCharts: {
      sessionTimeline,
    },
    upcomingSessions,
    topStudents,
    stats,
  };
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
  getDashboardData,
};
