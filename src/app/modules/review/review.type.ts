export interface IReviewCreateInput {
  tutorId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IReviewUpdateInput {
  rating?: number;
  comment?: string;
}