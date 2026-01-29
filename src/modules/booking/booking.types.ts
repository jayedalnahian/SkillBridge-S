




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