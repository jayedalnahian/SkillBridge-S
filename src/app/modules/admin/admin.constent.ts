import type { Prisma } from "../../generated/prisma/client.js";

// Searchable fields
export const adminSearchableFields = [
  "name",
  "email",
  "contactNumber",
  "address",
  "User.name",
  "User.email",
  "id"
];

// Filterable fields
export const adminFilterableFields = [
  "isDeleted", // boolean filter
];

// Safe dynamic include config
export const adminIncludeConfig: Prisma.AdminInclude = {
  User: true,
};
