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
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

// Admin payload for creation
export interface IAdminPayload {
  password: string;
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
  };
}

// Admin payload for update
export interface IAdminUpdatePayload {
  name?: string;
  email?: string;
  profilePhoto?: string;
  contactNumber?: string;
  address?: string;
}
