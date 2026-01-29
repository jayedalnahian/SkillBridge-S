import { prisma } from "../../lib/prisma"
import { CreateAvailabilityInput } from "./availablity.types"

const getTutorAvailability = async (userProfileId: string) => {
    // 1️⃣ Find tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId },
    })

    if (!tutorProfile) {
        throw new Error("Tutor profile not found")
    }

    // (optional but recommended)
    if (!tutorProfile.isApproved) {
        throw new Error("Tutor is not approved yet")
    }

    // 2️⃣ Fetch availability slots
    const availability = await prisma.availability.findMany({
        where: {
            tutorProfileId: tutorProfile.id,
        },
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" },
        ],
    })

    return availability
}
const deleteAvailability = async (
    userProfileId: string,
    availabilityId: string
) => {
    // 1️⃣ Validate availability ID format (optional but good practice)
    if (!availabilityId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error("Invalid availability ID format")
    }

    // 2️⃣ Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId },
        select: { id: true, isApproved: true }
    })

    if (!tutorProfile) {
        throw new Error("Tutor profile not found")
    }

    if (!tutorProfile.isApproved) {
        throw new Error("Tutor is not approved yet")
    }

    // 3️⃣ Check if availability exists and belongs to this tutor
    const availability = await prisma.availability.findFirst({
        where: {
            id: availabilityId,
            tutorProfileId: tutorProfile.id,
        },
        select: {
            id: true,
            isBooked: true,
            startTime: true,
            endTime: true,
            dayOfWeek: true,
            specificDate: true,
        }
    })

    if (!availability) {
        throw new Error("Availability slot not found or you don't have permission to delete it")
    }

    // 4️⃣ Check if already booked
    if (availability.isBooked) {
        // Optional: Check if there are confirmed/upcoming bookings
        const upcomingBooking = await prisma.booking.findFirst({
            where: {
                availabilityId: availabilityId,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                },
                startDateTime: {
                    gte: new Date() // Only check future bookings
                }
            }
        })

        if (upcomingBooking) {
            throw new Error("Cannot delete availability slot with upcoming confirmed bookings")
        }

        // If booked but in past or completed/cancelled, we might still allow deletion
        // But for safety, we'll still prevent deletion if isBooked = true
        throw new Error("This slot has been booked and cannot be deleted")
    }

    // 5️⃣ Check if there are any pending/confirmed bookings for this slot
    const existingBookings = await prisma.booking.findFirst({
        where: {
            availabilityId: availabilityId,
            status: {
                in: ['PENDING', 'CONFIRMED']
            }
        }
    })

    if (existingBookings) {
        throw new Error("Cannot delete availability slot with pending or confirmed bookings")
    }

    // 6️⃣ Delete the availability slot
    const deletedAvailability = await prisma.availability.delete({
        where: {
            id: availabilityId,
            tutorProfileId: tutorProfile.id,
        }
    })

    return {
        id: deletedAvailability.id,
        message: "Availability slot deleted successfully",
        deletedAt: new Date()
    }
}




const createAvailability = async ({
    userProfileId,
    dayOfWeek,
    startTime,
    endTime,
    duration,
    maxStudents,
    specificDate,
}: CreateAvailabilityInput) => {
    // 1️⃣ Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userProfileId },
    })

    if (!tutorProfile) {
        throw new Error("Tutor profile not found")
    }

    if (!tutorProfile.isApproved) {
        throw new Error("Tutor is not approved yet")
    }

    // 2️⃣ Time conflict check
   const conflictingSlot = await prisma.availability.findFirst({
  where: {
    tutorProfileId: tutorProfile.id,
    dayOfWeek: { equals: dayOfWeek },
    ...(specificDate !== undefined && {
      specificDate: { equals: specificDate },
    }),
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  },
})


    if (conflictingSlot) {
        throw new Error("Time slot conflicts with an existing availability")
    }

    // 3️⃣ Create availability
    const availability = await prisma.availability.create({
        data: {
            tutorProfileId: tutorProfile.id,
            dayOfWeek,
            startTime,
            endTime,
            duration,
            ...(maxStudents !== undefined && { maxStudents }),
            ...(specificDate !== undefined && { specificDate }),
        },
    })

    return availability
}


export const availablityService = { getTutorAvailability, deleteAvailability, createAvailability }

