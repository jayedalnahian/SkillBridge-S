import status from "http-status";
import type { Admin, Prisma, Payment, Booking, Category, Tutor, User } from "../../generated/prisma/client.js";
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

// Dashboard Analytics Services

const getUserRoleDistribution = async () => {
  const distribution = await prisma.user.groupBy({
    by: ["role"],
    where: { isDeleted: false },
    _count: { role: true },
  });

  return distribution.map((item: { role: string; _count: { role: number } }) => ({
    role: item.role,
    count: item._count.role,
  }));
};

const getUserStatusDistribution = async () => {
  const distribution = await prisma.user.groupBy({
    by: ["status"],
    where: { isDeleted: false },
    _count: { status: true },
  });

  return distribution.map((item: { status: string; _count: { status: number } }) => ({
    status: item.status,
    count: item._count.status,
  }));
};

const getBookingStatusDistribution = async () => {
  const distribution = await prisma.booking.groupBy({
    by: ["status"],
    where: { isDeleted: false },
    _count: { status: true },
  });

  return distribution.map((item: { status: string; _count: { status: number } }) => ({
    status: item.status,
    count: item._count.status,
  }));
};

const getPaymentStatusDistribution = async () => {
  const distribution = await prisma.booking.groupBy({
    by: ["paymentStatus"],
    where: { isDeleted: false },
    _count: { paymentStatus: true },
  });

  return distribution.map((item: { paymentStatus: string; _count: { paymentStatus: number } }) => ({
    status: item.paymentStatus,
    count: item._count.paymentStatus,
  }));
};

const getTutorStatusDistribution = async () => {
  const distribution = await prisma.tutor.groupBy({
    by: ["status"],
    where: { isDeleted: false },
    _count: { status: true },
  });

  return distribution.map((item: { status: string; _count: { status: number } }) => ({
    status: item.status,
    count: item._count.status,
  }));
};

const getMonthlyRevenue = async (months: number = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startDate },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: { [key: string]: number } = {};

  payments.forEach((payment: Payment) => {
    const monthKey = payment.createdAt.toISOString().slice(0, 7); // YYYY-MM
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
  });

  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue,
  }));
};

const getMonthlyBookings = async (months: number = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: { [key: string]: number } = {};

  bookings.forEach((booking: Booking) => {
    const monthKey = booking.createdAt.toISOString().slice(0, 7);
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData).map(([month, bookings]) => ({
    month,
    bookings,
  }));
};

const getMonthlyRegistrations = async (months: number = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const users = await prisma.user.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: startDate },
    },
    select: {
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: { [key: string]: { students: number; tutors: number } } = {};

  users.forEach((user: User) => {
    const monthKey = user.createdAt.toISOString().slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { students: 0, tutors: 0 };
    }
    if (user.role === "STUDENT") {
      monthlyData[monthKey].students++;
    } else if (user.role === "TUTOR") {
      monthlyData[monthKey].tutors++;
    }
  });

  return Object.entries(monthlyData).map(([month, counts]) => ({
    month,
    students: counts.students,
    tutors: counts.tutors,
    total: counts.students + counts.tutors,
  }));
};

const getTopCategories = async (limit: number = 10) => {
  const categories = await prisma.category.findMany({
    where: { isDeleted: false },
    include: {
      tutorCategories: {
        where: { Tutor: { isDeleted: false } },
        select: { tutorId: true },
      },
    },
    orderBy: {
      tutorCategories: { _count: "desc" },
    },
    take: limit,
  });

  return categories.map((category: Category & { tutorCategories: { tutorId: string }[] }) => ({
    name: category.name,
    tutorCount: category.tutorCategories.length,
  }));
};

const getTutorExperienceDistribution = async () => {
  const tutors = await prisma.tutor.findMany({
    where: { isDeleted: false },
    select: { experienceYears: true },
  });

  const ranges = {
    "0-2": 0,
    "3-5": 0,
    "5-10": 0,
    "10+": 0,
  };

  tutors.forEach((tutor: Tutor) => {
    const years = tutor.experienceYears;
    if (years <= 2) ranges["0-2"]++;
    else if (years <= 5) ranges["3-5"]++;
    else if (years <= 10) ranges["5-10"]++;
    else ranges["10+"]++;
  });

  return Object.entries(ranges).map(([range, count]) => ({
    range,
    count,
  }));
};

const getHourlyRateDistribution = async () => {
  const tutors = await prisma.tutor.findMany({
    where: { isDeleted: false },
    select: { hourlyRate: true },
  });

  const ranges = {
    "0-25": 0,
    "25-50": 0,
    "50-100": 0,
    "100+": 0,
  };

  tutors.forEach((tutor: Tutor) => {
    const rate = tutor.hourlyRate;
    if (rate <= 25) ranges["0-25"]++;
    else if (rate <= 50) ranges["25-50"]++;
    else if (rate <= 100) ranges["50-100"]++;
    else ranges["100+"]++;
  });

  return Object.entries(ranges).map(([range, count]) => ({
    range,
    count,
  }));
};

const getPlatformGrowth = async (months: number = 12) => {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: { [key: string]: { students: number; tutors: number } } = {};

  users.forEach((user: User) => {
    const monthKey = user.createdAt.toISOString().slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { students: 0, tutors: 0 };
    }
    if (user.role === "STUDENT") {
      monthlyData[monthKey].students++;
    } else if (user.role === "TUTOR") {
      monthlyData[monthKey].tutors++;
    }
  });

  let cumulativeStudents = 0;
  let cumulativeTutors = 0;

  const sortedMonths = Object.keys(monthlyData).sort();

  return sortedMonths.map((month) => {
    cumulativeStudents += monthlyData[month].students;
    cumulativeTutors += monthlyData[month].tutors;
    return {
      month,
      students: cumulativeStudents,
      tutors: cumulativeTutors,
      totalUsers: cumulativeStudents + cumulativeTutors,
    };
  });
};

const getRevenueTrend = async (months: number = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startDate },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: { [key: string]: number } = {};

  payments.forEach((payment: Payment) => {
    const monthKey = payment.createdAt.toISOString().slice(0, 7);
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
  });

  let cumulative = 0;
  const sortedMonths = Object.keys(monthlyData).sort();

  return sortedMonths.map((month) => {
    cumulative += monthlyData[month];
    return {
      month,
      monthlyRevenue: monthlyData[month],
      cumulativeRevenue: cumulative,
    };
  });
};

const getBookingVolume = async (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyData: { [key: string]: number } = {};

  bookings.forEach((booking: Booking) => {
    const dateKey = booking.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
  });

  return Object.entries(dailyData).map(([date, count]) => ({
    date,
    count,
  }));
};

const getAdminStats = async () => {
  const [
    totalRevenue,
    activeBookings,
    avgRating,
    totalCategories,
    avgDuration,
    totalStudents,
    totalTutors,
    totalAdmins,
    totalUsers,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        isDeleted: false,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    }),
    prisma.tutor.aggregate({
      where: { isDeleted: false },
      _avg: { avgRating: true },
    }),
    prisma.category.count({ where: { isDeleted: false } }),
    prisma.booking.aggregate({
      where: { isDeleted: false },
      _avg: { duration: true },
    }),
    prisma.student.count({ where: { isDeleted: false } }),
    prisma.tutor.count({ where: { isDeleted: false } }),
    prisma.admin.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: false } }),
  ]);

  return {
    totalPlatformRevenue: totalRevenue._sum.amount || 0,
    totalActiveBookings: activeBookings,
    averageTutorRating: avgRating._avg.avgRating,
    totalCategories,
    averageSessionDuration: avgDuration._avg.duration,
    totalStudents,
    totalTutors,
    totalAdmins,
    totalUsers,
  };
};

const getDashboardData = async () => {
  const [
    userRoleDistribution,
    userStatusDistribution,
    bookingStatusDistribution,
    paymentStatusDistribution,
    tutorStatusDistribution,
    monthlyRevenue,
    monthlyBookings,
    monthlyRegistrations,
    topCategories,
    tutorExperienceDistribution,
    hourlyRateDistribution,
    platformGrowth,
    revenueTrend,
    bookingVolume,
    stats,
  ] = await Promise.all([
    getUserRoleDistribution(),
    getUserStatusDistribution(),
    getBookingStatusDistribution(),
    getPaymentStatusDistribution(),
    getTutorStatusDistribution(),
    getMonthlyRevenue(),
    getMonthlyBookings(),
    getMonthlyRegistrations(),
    getTopCategories(),
    getTutorExperienceDistribution(),
    getHourlyRateDistribution(),
    getPlatformGrowth(),
    getRevenueTrend(),
    getBookingVolume(),
    getAdminStats(),
  ]);

  return {
    pieCharts: {
      userRoleDistribution,
      userStatusDistribution,
      bookingStatusDistribution,
      paymentStatusDistribution,
      tutorStatusDistribution,
    },
    barCharts: {
      monthlyRevenue,
      monthlyBookings,
      monthlyRegistrations,
      topCategories,
      tutorExperienceDistribution,
      hourlyRateDistribution,
    },
    areaCharts: {
      platformGrowth,
      revenueTrend,
      bookingVolume,
    },
    stats,
  };
};

export const adminService = {
  getAllAdmins,
  getSingleAdmin,
  createAdmin,
  updateAdmin,
  hardDeleteAdmin,
  getDashboardData,
};
