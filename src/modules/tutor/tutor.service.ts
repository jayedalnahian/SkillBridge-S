import { prisma } from "../../lib/prisma"


const getTutors = async ({
    userId,
    searchString,
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
}: {
    userId?: string
    searchString?: string
    page: number
    limit: number
    skip: number
    sortBy: string
    sortOrder: string
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
}) => {

    // -------------------------
    // WHERE CONDITIONS
    // -------------------------
    const andConditions: any[] = []

    // Filter: category
    if (categoryId) {
        andConditions.push({
            tutorCategories: {
                some: {
                    categoryId: categoryId,
                },
            },
        })
    }

    // Filter: price range
    if (minPrice || maxPrice) {
        andConditions.push({
            hourlyRate: {
                gte: minPrice,
                lte: maxPrice,
            },
        })
    }

    // Filter: rating
    if (minRating) {
        andConditions.push({
            averageRating: {
                gte: minRating,
            },
        })
    }

    // Search: name OR bio
    if (searchString) {
        andConditions.push({
            OR: [
                {
                    bio: {
                        contains: searchString,
                        mode: "insensitive",
                    },
                },
                {
                    userProfile: {
                        name: {
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

    if (sortBy === "rating") {
        orderBy = { averageRating: sortOrder }
    }

    if (sortBy === "price") {
        orderBy = { hourlyRate: sortOrder }
    }

    if (sortBy === "experience") {
        orderBy = { experience: sortOrder }
    }

    // -------------------------
    // QUERY
    // -------------------------
    const data = await prisma.tutorProfile.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy,
        include: {
            userProfile: {
                select: {
                    id: true,
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
            reviews: true,
        },

    })

    const total = await prisma.tutorProfile.count({
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








export const tutorService = { getTutors }