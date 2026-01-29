import { BookingStatus, CancelledBy } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"
import { UserRole } from "../../middlewares/auth"
import { CancelBookingInput, CompleteBookingInput, CreateBookingInput, GetAllBookingsInput, GetUserBookingsInput } from "./booking.types"
import { v4 as uuidv4 } from "uuid"

const createBooking = async (data: CreateBookingInput) => {
    const {
        studentId,
        tutorProfileId,
        availabilityId,
        startDateTime,
        endDateTime,
        duration,
        studentNotes,
        meetingType = "ONLINE",
    } = data

    // 1️⃣ Check tutor exists and approved
    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
    })

    if (!tutor) throw new Error("Tutor not found")
    if (!tutor.isApproved) throw new Error("Tutor is not approved")

    // 2️⃣ Check availability slot if provided
    if (availabilityId) {
        const slot = await prisma.availability.findUnique({
            where: { id: availabilityId },
        })

        if (!slot) throw new Error("Availability slot not found")
        if (slot.isBooked) throw new Error("This slot is already booked")
    }

    // 3️⃣ Calculate price
    const price = tutor.hourlyRate.toNumber() * duration

    // 4️⃣ Generate meeting link (simple example)
    const meetingLink = `https://meet.example.com/${uuidv4()}`

    // 5️⃣ Create booking
    const booking = await prisma.booking.create({
        data: {
            studentId,
            tutorProfileId,
            availabilityId: availabilityId ?? null, // <- convert undefined to null
            startDateTime,
            endDateTime,
            duration,
            price,
            status: "PENDING",
            meetingLink,
            meetingType,
            studentNotes: studentNotes ?? null,      // <- convert undefined to null
        },
    })

    // 6️⃣ Mark availability as booked
    if (availabilityId) {
        await prisma.availability.update({
            where: { id: availabilityId },
            data: { isBooked: true },
        })
    }

    return booking
}



const getUserBookings = async ({
    userProfileId,
    role,
    status,
}: GetUserBookingsInput) => {
    // Build Prisma where condition
    const where: any = {}

    if (role === "STUDENT") {
        where.studentId = userProfileId
    } else if (role === "TUTOR") {
        where.tutorProfileId = userProfileId
    } else {
        throw new Error("Invalid role")
    }

    if (status) {
        where.status = status
    }

    // Fetch bookings from DB
    const bookings = await prisma.booking.findMany({
        where,
        orderBy: { startDateTime: "desc" },
        include: {
            tutorProfile: {
                include: {
                    userProfile: {
                        select: {
                            id: true,
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                },
            },
            student: {
                select: {
                    id: true,
                    user: { select: { id: true, name: true, email: true } },
                },
            },
            review: true,
        },
    })

    return bookings
}



const getBookingById = async ({
    bookingId,
    userProfileId,
    role,
}: {
    bookingId: string
    userProfileId: string
    role: UserRole
}) => {
    // Fetch booking with related data
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            tutorProfile: {
                include: {
                    userProfile: {
                        select: {
                            id: true,
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                },
            },
            student: {
                select: {
                    id: true,
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
            review: true,
        },
    })

    if (!booking) {
        throw new Error("Booking not found")
    }

    // Authorization: only the student or tutor can access
    if (
        (role === "STUDENT" && booking.studentId !== userProfileId) ||
        (role === "TUTOR" && booking.tutorProfileId !== userProfileId)
    ) {
        throw new Error("Access denied")
    }

    return booking
}



const cancelBooking = async ({
    bookingId,
    userProfileId,
    role,
    reason,
}: CancelBookingInput) => {
    // 1️⃣ Find booking
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    })

    if (!booking) throw new Error("Booking not found")

    // 2️⃣ Authorization
    if (
        (role === "STUDENT" && booking.studentId !== userProfileId) ||
        (role === "TUTOR" && booking.tutorProfileId !== userProfileId)
    ) {
        throw new Error("Access denied")
    }

    if (booking.status === BookingStatus.CANCELLED) {
        throw new Error("Booking is already cancelled")
    }

    // 3️⃣ Update booking
    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: BookingStatus.CANCELLED,
            cancelledBy: role === "STUDENT" ? CancelledBy.STUDENT : CancelledBy.TUTOR,
            cancellationReason: reason || '',
            cancelledAt: new Date(),
        },
    })

    // 4️⃣ Free availability slot if exists
    if (booking.availabilityId) {
        await prisma.availability.update({
            where: { id: booking.availabilityId },
            data: { isBooked: false },
        })
    }

    return updatedBooking
}


const completeBooking = async ({
    bookingId,
    userProfileId,
    role,
}: CompleteBookingInput) => {
    // 1️⃣ Find booking
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    })

    if (!booking) throw new Error("Booking not found")

    // 2️⃣ Authorization: only tutor can complete
    if (role !== "TUTOR" || booking.tutorProfileId !== userProfileId) {
        throw new Error("Only the tutor can mark this booking as completed")
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
        throw new Error("Only confirmed bookings can be completed")
    }

    // 3️⃣ Update booking status
    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
    })

    return updatedBooking
}



const getAllBookings = async ({
    studentId,
    tutorProfileId,
    status,
    startDate,
    endDate,
    page,
    limit,
    skip,
    sortBy = "startDateTime",
    sortOrder = "desc",
}: GetAllBookingsInput) => {
    const andConditions: any[] = []

    if (studentId) {
        andConditions.push({ studentId })
    }
    if (tutorProfileId) {
        andConditions.push({ tutorProfileId })
    }
    if (status) {
        andConditions.push({ status })
    }
    if (startDate) {
        andConditions.push({ startDateTime: { gte: startDate } })
    }
    if (endDate) {
        andConditions.push({ endDateTime: { lte: endDate } })
    }

    const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {}

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            student: {
                select: {
                    id: true,
                    user: { select: { name: true, email: true } },
                },
            },
            tutorProfile: {
                select: {
                    id: true,
                    userProfile: { select: { user: { select: { name: true, email: true } } } },
                },
            },
            review: true,

        },
    })

    const total = await prisma.booking.count({ where: whereCondition })

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: bookings,
    }
}

export const bookingService = { getAllBookings, completeBooking, cancelBooking, createBooking, getUserBookings, getBookingById }
