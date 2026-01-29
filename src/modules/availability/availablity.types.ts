import { Days } from "../../../generated/prisma/enums"







export interface CreateAvailabilityInput {
    userProfileId: string
    dayOfWeek: Days
    startTime: string
    endTime: string
    duration: number
    maxStudents?: number
    specificDate?: Date
}



export interface AvailabilityFilterOptions {
    startDate?: string
    endDate?: string
    dayOfWeek?: string
    minDuration?: number
    maxPrice?: number
}