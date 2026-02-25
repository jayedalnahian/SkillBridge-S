import { Prisma } from "../../../generated/prisma/client"

// Fields that support text search (used with searchTerm query param)
export const tutorSearchableFields = [
    "name",
    "email",
    "designation",
    "educationLevel",
    "contactNumber",
    "User.name",
    "User.email",
]

// Fields that can be used as exact/range filters in query params
export const tutorFilterableFields = [
    "name",
    "email",
    "experienceYears",
    "educationLevel",
    "hourlyRate",
    "designation",
    "tutorCategoryId",
    "availableDays",
]

// Relations that can be dynamically included via ?include=reviews,bookings
// Relations that can be dynamically included via ?include=reviews,bookings
export const tutorIncludeConfig: Prisma.TutorInclude = {
    User: true,
    reviews: true,
    bookings: true,
    tutorCategory: true,
}       