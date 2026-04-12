import status from "http-status";
import AppError from "../../errorHalpers/AppError";
import { Prisma, User, UserStatus } from "../../generated/prisma/client";
import { IQueryParams } from "../../interface/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  userFilterableFields,
  userIncludeConfig,
  userSearchableFields,
} from "./user.constant";

const getAllUsers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    User,
    Prisma.UserWhereInput,
    Prisma.UserInclude
  >(prisma.user, query, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .where({
      isDeleted: false, // 🔥 always exclude deleted
    })
    .dynamicInclude(userIncludeConfig)
    .paginate()
    .fields()
    .sort()
    .execute();

  return result;
};

const updateUserStatus = async (id: string, payload: UserStatus) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

const deleteUser = async (id: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  return result;
};

export const UserService = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
};
