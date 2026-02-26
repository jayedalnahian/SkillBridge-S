import { Prisma } from "../../../generated/prisma/client";

// 🔍 Searchable fields
export const userSearchableFields = [
    "name",
    "email",
];

// 🎯 Filterable fields
export const userFilterableFields = [
    "role",
    "status",
    "isDeleted",
];

// 🔗 Include config
export const userIncludeConfig: Prisma.UserInclude = {
    tutor: true,
    admin: true,
    reviews: true,
    bookings: true,
};