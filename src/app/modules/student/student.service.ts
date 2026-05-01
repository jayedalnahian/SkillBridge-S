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

export const StudentService = {
  getAllStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  bulkSoftDeleteStudents,
  hardDeleteStudent,
  restoreStudent,
};
