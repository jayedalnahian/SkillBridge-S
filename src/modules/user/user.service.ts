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





export const userService = { getAllUsers, updateUserStatus }