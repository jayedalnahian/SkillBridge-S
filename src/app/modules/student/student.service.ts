import status from "http-status";
import { prisma } from "../../lib/prisma.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import AppError from "../../errorHalpers/AppError.js";
import { IStudentUpdatePayload } from "./student.type.js";
import prismaClientPkg from "../../generated/prisma/client.js";

const { BookingStatus } = prismaClientPkg as any;

const studentSearchableFields = ["name", "contactNumber", "description", "email", "id"];
const studentFilterableFields = ["isDeleted"];

const getAllStudents = async (query: IQueryParams) => {
  const studentQuery = new QueryBuilder(prisma.student, query, {
    searchableFields: studentSearchableFields,
    filterableFields: studentFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .fields();

  const result = await studentQuery.execute();
  return result;
};

const getStudentById = async (id: string) => {
  // Validate ID format (ULID is 26 chars, but we'll accept any non-empty string for flexibility)
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid student ID provided");
  }

  const student = await prisma.student.findUnique({
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

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  if (student.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  // Remove sensitive fields from response
  const { isDeleted, deletedAt, ...studentData } = student;

  return studentData;
};



const updateStudent = async (id: string, payload: IStudentUpdatePayload) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid student ID provided");
  }

  // Check if student exists and is not deleted
  const student = await prisma.student.findUnique({
    where: { id },
    include: { User: true },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  if (student.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  // Check for email conflict if email is being updated
  if (payload.email && payload.email !== student.email) {
    const emailExists = await prisma.student.findFirst({
      where: {
        email: payload.email,
        isDeleted: false,
        id: { not: id },
      },
    });

    if (emailExists) {
      throw new AppError(
        status.CONFLICT,
        `Student with email "${payload.email}" already exists`,
      );
    }

    // Also check if email exists in User table
    const userEmailExists = await prisma.user.findFirst({
      where: {
        email: payload.email,
        isDeleted: false,
        id: { not: student.userId },
      },
    });

    if (userEmailExists) {
      throw new AppError(
        status.CONFLICT,
        `User with email "${payload.email}" already exists`,
      );
    }
  }

  // Update student in transaction to sync with User if needed
  const result = await prisma.$transaction(async (tx: any) => {
    // Update student
    const updatedStudent = await tx.student.update({
      where: { id },
      data: payload,
    });

    // If name or email changed, also update the associated User record
    if (payload.name || payload.email) {
      await tx.user.update({
        where: { id: student.userId },
        data: {
          ...(payload.name && { name: payload.name }),
          ...(payload.email && { email: payload.email }),
        },
      });
    }

    return updatedStudent;
  });

  return result;
};

const softDeleteStudent = async (id: string) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid student ID provided");
  }

  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  if (student.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Student is already deleted");
  }

  // Check for active or pending bookings
  const hasActiveBookings = await prisma.booking.findFirst({
    where: {
      studentId: id,
      status: {
        in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
      },
    },
  });

  if (hasActiveBookings) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete student with active or pending bookings",
    );
  }

  // Soft delete student and associated user in transaction
  const result = await prisma.$transaction(async (tx: any) => {
    const deletedStudent = await tx.student.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: student.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedStudent;
  });

  return result;
};

const bulkSoftDeleteStudents = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    throw new AppError(status.BAD_REQUEST, "No student IDs provided");
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
      const student = await prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        results.notFound.push(id);
        continue;
      }

      // Skip if already deleted
      if (student.isDeleted) {
        results.alreadyDeleted.push(id);
        continue;
      }

      // Check for active or pending bookings
      const hasActiveBookings = await prisma.booking.findFirst({
        where: {
          studentId: id,
          status: {
            in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
          },
        },
      });

      if (hasActiveBookings) {
        results.hasBookings.push(id);
        continue;
      }

      // Soft delete student and associated user in transaction
      await prisma.$transaction(async (tx: any) => {
        await tx.student.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: student.userId },
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
      messages.push(`${results.notFound.length} student(s) not found`);
    }
    if (results.hasBookings.length > 0) {
      messages.push(`${results.hasBookings.length} student(s) have active/pending bookings`);
    }
    if (results.alreadyDeleted.length > 0) {
      messages.push(`${results.alreadyDeleted.length} student(s) already deleted`);
    }
    if (results.errors.length > 0) {
      messages.push(`${results.errors.length} student(s) failed to delete`);
    }
    throw new AppError(status.BAD_REQUEST, messages.join("; "));
  }

  return results;
};

const hardDeleteStudent = async (id: string) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid student ID provided");
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      bookings: {
        where: {
          status: {
            in: [BookingStatus.ACCEPTED, BookingStatus.PENDING],
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  // Only allow hard delete if student is soft-deleted
  if (!student.isDeleted) {
    throw new AppError(
      status.BAD_REQUEST,
      "Student must be soft-deleted before permanent deletion",
    );
  }

  // Check for active or pending bookings
  if (student.bookings.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot permanently delete student with active or pending bookings",
    );
  }

  // Permanent delete - Prisma will handle related data via Cascade
  const result = await prisma.$transaction(async (tx: any) => {
    // Delete student first (this will cascade delete bookings, reviews via onDelete: Cascade)
    await tx.student.delete({
      where: { id },
    });

    // Delete the associated user account
    await tx.user.delete({
      where: { id: student.userId },
    });

    return { id, message: "Student permanently deleted" };
  });

  return result;
};

const restoreStudent = async (id: string) => {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new AppError(status.BAD_REQUEST, "Invalid student ID provided");
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { User: true },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  if (!student.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Student is not deleted");
  }

  // Check for email conflicts with active students
  const emailConflict = await prisma.student.findFirst({
    where: {
      email: student.email,
      isDeleted: false,
      id: { not: id },
    },
  });
  if (emailConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active student with email "${student.email}" already exists`,
    );
  }

  // Check for user email conflicts
  const userEmailConflict = await prisma.user.findFirst({
    where: {
      email: student.User.email,
      isDeleted: false,
      id: { not: student.userId },
    },
  });
  if (userEmailConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active user with email "${student.User.email}" already exists`,
    );
  }

  // Restore student and associated user in transaction
  const result = await prisma.$transaction(async (tx: any) => {
    const restoredStudent = await tx.student.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await tx.user.update({
      where: { id: student.userId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return restoredStudent;
  });

  return result;
};



const getCurrentStudent = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: {
      userId
    }
  })

  if (!student){
    throw new AppError(status.NOT_FOUND, "student not found")
  }

  return student
}



const getBookingStatusDistribution = async (studentId: string) =>{
  const currentStudent = await getCurrentStudent(studentId)


  const distribution = await prisma.booking.groupBy({
    by: ["status"],
    where: {
      isDeleted: false,
      studentId: currentStudent.id
    },
    _count: { status: true },
  })

  return distribution.map((item: { status: string; _count: { status: number } }) => ({
    status: item.status,
    count: item._count.status,
  }));
}

const getPaymentStatusDistribution = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
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

const getSubjectDistribution = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
    },
    include: {
      Tutor: {
        include: {
          tutorCategory: {
            include: {
              Category: true,
            },
          },
        },
      },
    },
  });

  const subjectCount: Record<string, number> = {};
  bookings.forEach((booking: { Tutor: { tutorCategory: { Category: { name: string } }[] } }) => {
    booking.Tutor.tutorCategory.forEach((tc: { Category: { name: string } }) => {
      const subjectName = tc.Category.name;
      subjectCount[subjectName] = (subjectCount[subjectName] || 0) + 1;
    });
  });

  return Object.entries(subjectCount)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const getMonthlyBookings = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
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

const getMonthlySpending = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
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
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const getSessionTimeline = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
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

const getUpcomingSessions = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
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
      Tutor: {
        select: {
          name: true,
        },
      },
    },
  });

  return bookings.map((booking: {
    id: string;
    Tutor: { name: string };
    startDateTime: Date;
    duration: number;
    meetingLink: string | null;
  }) => ({
    id: booking.id,
    tutorName: booking.Tutor.name,
    subject: "Tutoring Session",
    startDateTime: booking.startDateTime.toISOString(),
    duration: booking.duration,
    meetingLink: booking.meetingLink,
  }));
};

const getFavoriteTutors = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
      status: "COMPLETED",
    },
    include: {
      Tutor: {
        include: {
          tutorCategory: {
            include: {
              Category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const tutorStats: Record<string, {
    id: string;
    name: string;
    totalSessions: number;
    avgRating: number;
    subjects: string[];
  }> = {};

  bookings.forEach((booking: {
    Tutor: {
      id: string;
      name: string;
      avgRating: number;
      tutorCategory: { Category: { name: string } }[];
    };
  }) => {
    const tutorId = booking.Tutor.id;
    if (!tutorStats[tutorId]) {
      tutorStats[tutorId] = {
        id: tutorId,
        name: booking.Tutor.name,
        totalSessions: 0,
        avgRating: booking.Tutor.avgRating,
        subjects: booking.Tutor.tutorCategory.map((tc: { Category: { name: string } }) => tc.Category.name),
      };
    }
    tutorStats[tutorId].totalSessions++;
  });

  return Object.values(tutorStats)
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 5)
    .map((tutor) => ({
      id: tutor.id,
      name: tutor.name,
      subject: tutor.subjects[0] || "General",
      avgRating: tutor.avgRating,
      totalSessions: tutor.totalSessions,
    }));
};

const getStudentStats = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const [
    totalBookings,
    completedBookings,
    upcomingBookings,
    reviews,
    uniqueTutors,
    totalHours,
  ] = await Promise.all([
    prisma.booking.count({
      where: { isDeleted: false, studentId: currentStudent.id },
    }),
    prisma.booking.count({
      where: { isDeleted: false, studentId: currentStudent.id, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: {
        isDeleted: false,
        studentId: currentStudent.id,
        status: { in: ["PENDING", "ACCEPTED"] },
        startDateTime: { gte: new Date() },
      },
    }),
    prisma.review.findMany({
      where: { isDeleted: false, studentId: currentStudent.id },
      select: { rating: true },
    }),
    prisma.booking.groupBy({
      by: ["tutorId"],
      where: { isDeleted: false, studentId: currentStudent.id },
      _count: { tutorId: true },
    }),
    prisma.booking.aggregate({
      where: { isDeleted: false, studentId: currentStudent.id, status: "COMPLETED" },
      _sum: { duration: true },
    }),
  ]);

  const totalReviews = reviews.length;
  const averageRatingGiven = totalReviews > 0
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
    : null;

  const bookingsWithPayments = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      studentId: currentStudent.id,
      paymentStatus: "PAID",
    },
    include: {
      payment: true,
    },
  });

  const totalSpent = bookingsWithPayments.reduce(
    (sum: number, b: { payment: { amount: number } | null }) => sum + (b.payment?.amount || 0),
    0
  );

  return {
    totalBookings,
    completedSessions: completedBookings,
    upcomingSessions: upcomingBookings,
    totalSpent,
    averageRatingGiven,
    totalReviews,
    uniqueTutors: uniqueTutors.length,
    totalHoursLearned: totalHours._sum.duration || 0,
  };
};

const getDashboardData = async (studentId: string) => {
  const currentStudent = await getCurrentStudent(studentId);

  const [
    bookingStatusDistribution,
    paymentStatusDistribution,
    subjectDistribution,
    monthlyBookings,
    monthlySpending,
    sessionTimeline,
    upcomingSessions,
    favoriteTutors,
    stats,
  ] = await Promise.all([
    getBookingStatusDistribution(studentId),
    getPaymentStatusDistribution(studentId),
    getSubjectDistribution(studentId),
    getMonthlyBookings(studentId),
    getMonthlySpending(studentId),
    getSessionTimeline(studentId),
    getUpcomingSessions(studentId),
    getFavoriteTutors(studentId),
    getStudentStats(studentId),
  ]);

  return {
    pieCharts: {
      bookingStatusDistribution,
      paymentStatusDistribution,
      subjectDistribution,
    },
    barCharts: {
      monthlyBookings,
      monthlySpending,
    },
    lineCharts: {
      sessionTimeline,
    },
    upcomingSessions,
    favoriteTutors,
    stats,
  };
};

export const StudentService = {
  getAllStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  bulkSoftDeleteStudents,
  hardDeleteStudent,
  restoreStudent,
  getDashboardData,
};
