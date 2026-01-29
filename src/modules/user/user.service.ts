import { BookingStatus } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"

const getAllUsers = async ({
    searchString,
    role,
    status,
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
}: {
    searchString?: string
    role?: "STUDENT" | "TUTOR" | "ADMIN"
    status?: "ACTIVE" | "BANNED"
    page: number
    limit: number
    skip: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
}) => {
    // -------------------------
    // WHERE CONDITIONS
    // -------------------------
    const andConditions: any[] = []

    // Filter: role
    if (role) {
        andConditions.push({
            role,
        })
    }

    // Filter: status
    if (status) {
        andConditions.push({
            status,
        })
    }

    // Search: name OR email
    if (searchString) {
        andConditions.push({
            OR: [
                {
                    user: {
                        name: {
                            contains: searchString,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    user: {
                        email: {
                            contains: searchString,
                            mode: "insensitive",
                        },
                    },
                },
            ],
        })
    }

    const whereCondition =
        andConditions.length > 0 ? { AND: andConditions } : {}

    // -------------------------
    // SORTING
    // -------------------------
    let orderBy: any = { createdAt: "desc" }

    if (sortBy === "name") {
        orderBy = {
            user: {
                name: sortOrder,
            },
        }
    }

    if (sortBy === "email") {
        orderBy = {
            user: {
                email: sortOrder,
            },
        }
    }

    // -------------------------
    // QUERY
    // -------------------------
    const data = await prisma.userProfile.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    emailVerified: true,
                    createdAt: true,
                },
            },
            tutorProfile: true, // null for students/admins
        },
    })

    const total = await prisma.userProfile.count({
        where: whereCondition,
    })

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data,
    }
}


const updateUserStatus = async ({ userId }: { userId: string }) => {
    const userProfile = await prisma.userProfile.findUnique({
        where: { id: userId },
    })

    if (!userProfile) {
        throw new Error("User not found")
    }

    if (userProfile.role === "ADMIN") {
        throw new Error("Admins cannot be banned")
    }


    const updatedUser = await prisma.userProfile.update({
        where: { id: userId },
        data: {
            status: userProfile.status === "ACTIVE" ? "BANNED" : "ACTIVE",
        },
    })

    return updatedUser
}





const getStudentDashboardStats = async (studentProfileId: string) => {
    const now = new Date()

    const [
        totalBookings,
        upcomingSessions,
        completedSessions,
    ] = await prisma.$transaction([
        // Total bookings
        prisma.booking.count({
            where: {
                studentId: studentProfileId,
            },
        }),

        // Upcoming sessions
        prisma.booking.count({
            where: {
                studentId: studentProfileId,
                status: {
                    in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
                },
                startDateTime: {
                    gt: now,
                },
            },
        }),

        // Completed sessions
        prisma.booking.count({
            where: {
                studentId: studentProfileId,
                status: BookingStatus.COMPLETED,
            },
        }),
    ])

    return {
        totalBookings,
        upcomingSessions,
        completedSessions,
    }
}




const getTutorDashboardStats = async (tutorProfileId: string) => {
    // 1️⃣ Total earnings (only completed sessions)
    const earningsAgg = await prisma.booking.aggregate({
        where: {
            tutorProfileId,
            status: BookingStatus.COMPLETED,
        },
        _sum: {
            price: true,
        },
    })

    const totalEarnings = earningsAgg._sum.price ?? 0

    // 2️⃣ Total completed sessions
    const totalSessions = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: BookingStatus.COMPLETED,
        },
    })

    // 3️⃣ Pending bookings
    const pendingBookings = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: BookingStatus.PENDING,
        },
    })

    // 4️⃣ Average rating
    const ratingAgg = await prisma.review.aggregate({
        where: {
            tutorProfileId,
        },
        _avg: {
            rating: true,
        },
    })

    const averageRating = ratingAgg._avg.rating ?? 0

    return {
        totalEarnings,
        totalSessions,
        pendingBookings,
        averageRating: Number(averageRating.toFixed(2)),
    }
}




const getAdminDashboardStats = async () => {
    // 1️⃣ Total users
    const totalUsers = await prisma.userProfile.count()

    // 2️⃣ Total tutors (approved tutors only)
    const totalTutors = await prisma.tutorProfile.count({
        where: {
            isApproved: true,
        },
    })

    // 3️⃣ Total bookings
    const totalBookings = await prisma.booking.count()

    // 4️⃣ Total revenue (completed bookings only)
    const revenueAgg = await prisma.booking.aggregate({
        where: {
            status: BookingStatus.COMPLETED,
        },
        _sum: {
            price: true,
        },
    })

    const totalRevenue = revenueAgg._sum.price ?? 0

    return {
        totalUsers,
        totalTutors,
        totalBookings,
        totalRevenue,
    }
}


const getPendingTutors = async () => {
    const pendingTutors = await prisma.tutorProfile.findMany({
        where: {
            isApproved: false,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            userProfile: {
                select: {
                    id: true,
                    role: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            tutorCategories: {
                include: {
                    category: true,
                },
            },
        },
    })

    return pendingTutors
}
export const userService = { getPendingTutors, getAdminDashboardStats, getAllUsers, getTutorDashboardStats, updateUserStatus, getStudentDashboardStats }