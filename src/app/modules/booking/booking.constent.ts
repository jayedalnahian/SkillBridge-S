// Searchable fields for booking search functionality
export const bookingSearchableFields = [
    "Student.user.name",
    "Student.user.email",
    "Tutor.user.name",
    "Tutor.user.email",
    "id",
];

// Filterable fields for booking filtering
export const bookingFilterableFields = [
    "studentId",
    "tutorId",
    "status",
    "paymentStatus",
    "isDeleted",
    "price",
    "duration",
    "startDateTime",
    "endDateTime",
];