import { prisma } from "../../lib/prisma"
import { ApplyTutorInput, UpdateTutorProfileInput } from "./tutor.types"


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




const applyForTutor = async (data: ApplyTutorInput) => {
    // -------------------------
    // Check if already a tutor
    // -------------------------
    const existingTutor = await prisma.tutorProfile.findUnique({
        where: { userProfileId: data.userProfileId },
    })

    if (existingTutor) {
        throw new Error("You have already applied or are a tutor")
    }

    // -------------------------
    // Create TutorProfile
    // -------------------------
    const tutorProfile = await prisma.tutorProfile.create({
        data: {
            userProfileId: data.userProfileId,
            bio: data.bio,
            hourlyRate: data.hourlyRate,
            experience: data.experience,
            isApproved: false, // default for applications
        },
    })

    return tutorProfile
}


const getTutorApplicationStatus = async (userProfileId: string) => {
    // Find the tutor profile for this user
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId },
        select: {
            isApproved: true,
        },
    })

    if (!tutorProfile) {
        return "NOT_APPLIED"
    }

    return tutorProfile.isApproved ? "APPROVED" : "PENDING"
}






const updateTutorProfile = async (data: UpdateTutorProfileInput) => {
    const { tutorProfileId, bio, hourlyRate, experience, categoryIds } = data

    // 1️⃣ Check if tutor exists and is approved
    const tutor = await prisma.tutorProfile.findUnique({
        where: { userProfileId: tutorProfileId },
        select: {
            id: true,
            isApproved: true,
        },
    })

    if (!tutor) {
        throw new Error("Tutor profile not found")
    }

    if (!tutor.isApproved) {
        throw new Error("Only approved tutors can update their profile")
    }

    // 2️⃣ Update the tutor profile fields
    await prisma.tutorProfile.update({
        where: { userProfileId: tutorProfileId },
        data: {
            ...(bio !== undefined && { bio }),
            ...(hourlyRate !== undefined && { hourlyRate }),
            ...(experience !== undefined && { experience }),
        },
    })

    // 3️⃣ Update tutor categories if provided
    if (categoryIds !== undefined) {
        // Remove existing categories
        await prisma.tutorCategory.deleteMany({
            where: { tutorProfileId },
        })

        // Add new categories
        const newCategories = categoryIds.map((categoryId) => ({
            tutorProfileId,
            categoryId,
        }))

        await prisma.tutorCategory.createMany({
            data: newCategories,
            skipDuplicates: true,
        })
    }

    // 4️⃣ Return updated profile with categories
    const updatedProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId: tutorProfileId },
        include: {
            tutorCategories: {
                include: { category: true },
            },
        },
    })

    return updatedProfile
}



const approveTutor = async (userProfileId: string) => {
    // 1️⃣ Find the tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId },
    })

    if (!tutorProfile) {
        throw new Error("Tutor profile not found")
    }

    if (tutorProfile.isApproved) {
        throw new Error("Tutor is already approved")
    }

    // 2️⃣ Approve tutor
    const updatedTutorProfile = await prisma.tutorProfile.update({
        where: { userProfileId },
        data: { isApproved: true },
    })

    // 3️⃣ Update user role to TUTOR
    await prisma.userProfile.update({
        where: { id: userProfileId },
        data: { role: "TUTOR" },
    })

    return updatedTutorProfile
}


const getTutorAvailability = async (tutorProfileId: string) => {
    // 1️⃣ Check tutor exists
    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
    })

    if (!tutor) {
        throw new Error("Tutor profile not found")
    }

    // 2️⃣ Fetch available slots (not booked)
    const now = new Date()

    const availability = await prisma.availability.findMany({
        where: {
            tutorProfileId,
            isBooked: false, // only free slots
            OR: [
                { specificDate: null }, // weekly slots
                { specificDate: { gte: now } }, // future specificDate slots
            ],
        },
        orderBy: { dayOfWeek: "asc", startTime: "asc" }, // sorted nicely
    })

    return availability
}




export const tutorService = { getTutorAvailability, getTutors, approveTutor, applyForTutor, getTutorApplicationStatus , updateTutorProfile}