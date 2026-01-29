export interface CreateReviewInput {
    bookingId: string
    studentId: string
    rating: number
    comment: string
}

export interface GetTutorReviewsInput {
    tutorProfileId: string
    page: number
    limit: number
    rating?: number | undefined  
    sortBy?: string | undefined  
    sortOrder?: 'asc' | 'desc' | undefined  
    includeTutorInfo?: boolean | undefined 
}