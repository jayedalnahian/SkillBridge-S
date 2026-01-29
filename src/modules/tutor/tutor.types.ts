export interface ApplyTutorInput {
    userProfileId: string // the student's userProfile ID
    bio: string
    hourlyRate: number
    experience: number
}



export interface UpdateTutorProfileInput {
    tutorProfileId: string
    bio?: string
    hourlyRate?: number
    experience?: number
    categoryIds?: string[] // array of category IDs
}