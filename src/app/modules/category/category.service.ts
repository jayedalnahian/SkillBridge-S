import status from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHalpers/AppError.js";
import { ICategoryCreateInput } from "./category.type.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";

const createCategory = async (payload: ICategoryCreateInput) => {
  const isCategoryExist = await prisma.category.findFirst({
    where: {
      name: payload.name,
    },
  });
  if (isCategoryExist) {
    throw new AppError(status.BAD_REQUEST, "Category already exists");
  }
  const result = await prisma.category.create({
    data: {
      ...payload,
    },
  });
  return result;
};

const categorySearchableFields = ["name", "slug", "description", "id"];
const categoryFilterableFields = ["name", "isDeleted"];

const getAllCategories = async (query: IQueryParams) => {
  const categoryQuery = new QueryBuilder(prisma.category, query, {
    searchableFields: categorySearchableFields,
    filterableFields: categoryFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .fields();

  const result = await categoryQuery.execute();
  return result;
};

const getCategoriesUsedByTutors = async (searchTerm?: string) => {
  // Find all categories that are linked to at least one non-deleted tutor
  const categories = await prisma.category.findMany({
    where: {
      isDeleted: false,
      tutorCategories: {
        some: {
          Tutor: {
            isDeleted: false,
          },
        },
      },
      // Optional search by name
      ...(searchTerm && {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    data: categories,
    meta: {
      page: 1,
      limit: categories.length,
      total: categories.length,
      totalPages: 1,
    },
  };
};

const deleteCategory = async (id: string) => {
  const categoryDetail = await prisma.category.findUnique({
    where: { id },
  });

  if (!categoryDetail) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  if (!categoryDetail.isDeleted) {
    const isCategoryUsed = await prisma.tutor.findFirst({
      where: {
        tutorCategories: {
          some: {
            categoryId: id,
          },
        },
      },
    });
    if (isCategoryUsed) {
      throw new AppError(status.BAD_REQUEST, "Category is in use by a tutor");
    }
  }

  const result = await prisma.category.delete({
    where: {
      id,
    },
    
  });

  return result;
};

const bulkDeleteCategories = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    throw new AppError(status.BAD_REQUEST, "No category IDs provided");
  }

  const results = {
    deleted: [] as string[],
    notFound: [] as string[],
    inUse: [] as string[],
    errors: [] as { id: string; message: string }[],
  };

  for (const id of ids) {
    try {
      const categoryDetail = await prisma.category.findUnique({
        where: { id },
      });

      if (!categoryDetail) {
        results.notFound.push(id);
        continue;
      }

      // Skip if already deleted
      if (categoryDetail.isDeleted) {
        results.deleted.push(id);
        continue;
      }

      // Check if category is in use by a tutor
      const isCategoryUsed = await prisma.tutor.findFirst({
        where: {
          tutorCategories: {
            some: {
              categoryId: id,
            },
          },
        },
      });

      if (isCategoryUsed) {
        results.inUse.push(id);
        continue;
      }

      // Soft delete
      await prisma.category.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      results.deleted.push(id);
    } catch (error: any) {
      results.errors.push({ id, message: error.message || "Unknown error" });
    }
  }

  // If nothing was deleted and there were errors, throw an error
  if (results.deleted.length === 0 && (results.notFound.length > 0 || results.inUse.length > 0 || results.errors.length > 0)) {
    const messages: string[] = [];
    if (results.notFound.length > 0) {
      messages.push(`${results.notFound.length} category(s) not found`);
    }
    if (results.inUse.length > 0) {
      messages.push(`${results.inUse.length} category(s) in use by tutors`);
    }
    if (results.errors.length > 0) {
      messages.push(`${results.errors.length} category(s) failed to delete`);
    }
    throw new AppError(status.BAD_REQUEST, messages.join("; "));
  }

  return results;
};

const restoreCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  if (!category.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Category is not deleted");
  }

  // Check for name conflicts with active categories
  const nameConflict = await prisma.category.findFirst({
    where: {
      name: category.name,
      isDeleted: false,
      id: { not: id },
    },
  });
  if (nameConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active category with name "${category.name}" already exists`,
    );
  }

  // Check for slug conflicts with active categories
  const slugConflict = await prisma.category.findFirst({
    where: {
      slug: category.slug,
      isDeleted: false,
      id: { not: id },
    },
  });
  if (slugConflict) {
    throw new AppError(
      status.CONFLICT,
      `Cannot restore: Another active category with slug "${category.slug}" already exists`,
    );
  }

  const result = await prisma.category.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });

  return result;
};

const updateCategory = async (id: string, payload: ICategoryCreateInput) => {
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      id,
    },
  });
  if (!isCategoryExist) {
    throw new AppError(status.BAD_REQUEST, "Category not found");
  }

  if (payload.name) {
    const nameConflict = await prisma.category.findFirst({
      where: {
        name: payload.name,
        id: {
          not: id,
        },
      },
    });
    if (nameConflict) {
      throw new AppError(
        status.BAD_REQUEST,
        "Another category with this name already exists",
      );
    }
  }

  const isCategoryUsed = await prisma.tutor.findFirst({
    where: {
      tutorCategories: {
        some: {
          categoryId: id,
        },
      },
    },
  });
  if (isCategoryUsed) {
    throw new AppError(status.BAD_REQUEST, "Category is in use by a tutor");
  }
  const result = await prisma.category.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });
  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoriesUsedByTutors,
  deleteCategory,
  bulkDeleteCategories,
  updateCategory,
  restoreCategory,
};
