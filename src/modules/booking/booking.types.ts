import { BookingStatus } from "../../../generated/prisma/enums"
import { UserRole } from "../../middlewares/auth"


export type BookingStatusFilter =
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "REFUNDED"

export interface CancelBookingInput {
    bookingId: string
    userProfileId: string
    role: UserRole
    reason?: string
}
export interface CompleteBookingInput {
    bookingId: string
    userProfileId: string
    role: UserRole
}


export interface GetAllBookingsInput {
    studentId?: string
    tutorProfileId?: string
    status?: BookingStatus
    startDate?: Date
    endDate?: Date
    page: number
    limit: number
    skip: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
}


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