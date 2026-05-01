import { Prisma } from "../../generated/prisma/client.js";

// Admin model type
export type Admin = Prisma.AdminGetPayload<{}>;

// Admin with relations
export type AdminWithRelations = Prisma.AdminGetPayload<{
  include: {
    User: true;
  };
}>;

// Admin query params interface
export interface IAdminQueryParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}
