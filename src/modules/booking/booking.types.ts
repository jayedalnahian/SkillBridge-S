import { BookingStatus } from "../../../generated/prisma/enums"
import { UserRole } from "../../middlewares/auth"


export type BookingStatusFilter =
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "REFUNDED"




export interface CreateBookingInput {
    studentId: string
    tutorProfileId: string
    availabilityId?: string
    startDateTime: Date
    endDateTime: Date
    duration: number // in hours
    studentNotes?: string
    meetingType?: "ONLINE" | "IN_PERSON"
}


export interface GetUserBookingsInput {
    userProfileId: string
    role: UserRole
    status?: BookingStatus | undefined // ✅ allow undefined
}