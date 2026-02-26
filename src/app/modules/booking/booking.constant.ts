export const BOOKING_SEARCHABLE_FIELDS = [
    "meetingLink",
    "Tutor.name",       // nested relation: Tutor.name
    "Tutor.email",
    "User.email",
];

export const BOOKING_FILTERABLE_FIELDS = [
    "status",
    "tutorId",
    "userId",
    "startDateTime",
    "endDateTime",
];

export const BOOKING_INCLUDE_CONFIG = {
    Tutor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
            hourlyRate: true,
        },
    },
    User: {
        select: {
            id: true,
            email: true,
            role: true,
        },
    },
    reviews: true,
} as const;

export const BOOKING_DEFAULT_INCLUDES = ["Tutor", "User"] as const;