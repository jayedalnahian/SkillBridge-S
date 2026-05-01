import type { Admin, Prisma } from "../../generated/prisma/client.js";
import { IQueryParams } from "../../interface/query.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
  adminFilterableFields,
  adminIncludeConfig,
  adminSearchableFields,
} from "./admin.constent.js";

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

export const adminService = {
  getAllAdmins,
};
