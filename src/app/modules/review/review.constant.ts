export const REVIEW_SEARCHABLE_FIELDS = [
    "comment",
    "User.email",
    "Tutor.name",
];

export const REVIEW_FILTERABLE_FIELDS = [
    "tutorId",
    "userId",
    "rating",
];

export const REVIEW_INCLUDE_CONFIG = {
    User: {
        select: {
            id: true,
            email: true,
        },
    },
    Tutor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
        },
    },
    Booking: {
        select: {
            id: true,
            startDateTime: true,
            endDateTime: true,
            duration: true,
            price: true,
            status: true,
        },
    },
} as const;

export const REVIEW_DEFAULT_INCLUDES = ["User", "Tutor"] as const;