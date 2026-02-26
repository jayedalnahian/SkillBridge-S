export interface ICreateReviewPayload {
    bookingId: string;
    rating: number;
    comment: string;
}


export interface IReviewQueryParams {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    fields?: string;
    include?: string;
    // filters
    rating?: string;
    userId?: string;
    tutorId?: string;
    [key: string]: string | undefined;
}