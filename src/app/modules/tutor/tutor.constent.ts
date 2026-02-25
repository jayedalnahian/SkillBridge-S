import { Prisma } from "../../../generated/prisma/client";

// Searchable fields
export const tutorSearchableFields = [
    "name",
    "email",
    "designation",
    "educationLevel",
    "contactNumber",
    "User.name",
    "User.email",
    "tutorCategory.Category.name", // ✅ relation search
];

// Filterable fields
export const tutorFilterableFields = [
    "name",
    "email",
    "experienceYears",
    "educationLevel",
    "hourlyRate",
    "designation",
    "availableDays", // enum array
    "tutorCategory.Category.name", // category filter
];

// Safe dynamic include config
export const tutorIncludeConfig: Prisma.TutorInclude = {
    User: true,
    reviews: true,
    bookings: true,

    tutorCategory: {
        include: {
            Category: true,
        },
    },
};