import { BookingStatus } from "../../generated/prisma/client.js"
import { TutorStatus } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"

const heroStats = async () => {

    console.log("Fetching hero stats...")
    const totalTutors = await prisma.tutor.count({
        where: {
            isDeleted: false,
            status: TutorStatus.ACTIVE,
        },
    })
    const totalStudents = await prisma.student.count()
    const totalCategories = await prisma.category.count({
        where: {
            isDeleted: false,
        },
    })

    const totalBookedSessions = await prisma.booking.count({
        where: {
            status: BookingStatus.COMPLETED,
        },
    })



    return {
        totalTutors,
        totalStudents,
        totalCategories,
        totalBookedSessions,
        // avgRating: avgRating._avg.rating ?? 0,
    }
}

export const statsService = {
    heroStats,
}