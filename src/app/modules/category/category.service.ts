import status from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHalpers/AppError";
import { ICategoryCreateInput } from "./category.type";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

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
        tutorCategory: {
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

  const result = await prisma.category.update({
    where: {
      id,
    },
    data: {
      isDeleted: !categoryDetail.isDeleted,
      deletedAt: categoryDetail.isDeleted ? null : new Date(),
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
      tutorCategory: {
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
  deleteCategory,
  updateCategory,
};
