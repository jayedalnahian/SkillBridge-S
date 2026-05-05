// Searchable fields for booking search functionality
// Note: Student and Tutor are single relations (belongs-to) on Booking,
// so we use direct fields only. The QueryBuilder uses 'some' for nested
// relations which only works with many-to-many relations.
export const bookingSearchableFields = [
    "id",
    "studentId",
    "tutorId",
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