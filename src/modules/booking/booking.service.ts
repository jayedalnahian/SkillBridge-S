import { prisma } from "../../lib/prisma"
import { CreateBookingInput } from "./booking.types"
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


export const bookingService = { createBooking }
