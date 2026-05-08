import z from "zod";
import { createTutorSchema, updateTutorSchema } from "./tutor.validate.js";

export type ITutorPayload = z.infer<typeof createTutorSchema>;
export type ITutorUpdatePayload = z.infer<typeof updateTutorSchema>;

// Dashboard Analytics Types

export interface ITutorBookingStatusDistribution {
  status: string;
  count: number;
}

export interface ITutorPaymentStatusDistribution {
  status: string;
  count: number;
}

export interface ITutorMonthlyBookings {
  month: string;
  bookings: number;
}

export interface ITutorMonthlyEarnings {
  month: string;
  earnings: number;
}

export interface ITutorUpcomingSession {
  id: string;
  studentName: string;
  subject: string;
  startDateTime: string;
  duration: number;
  meetingLink: string | null;
}

export interface ITutorTopStudent {
  id: string;
  name: string;
  totalSessions: number;
  totalPaid: number;
}

export interface ITutorRatingDistribution {
  rating: number;
  count: number;
}

export interface ITutorSessionTimeline {
  date: string;
  completed: number;
  upcoming: number;
}

export interface ITutorStats {
  totalBookings: number;
  completedSessions: number;
  upcomingSessions: number;
  totalEarnings: number;
  averageRating: number | null;
  totalReviews: number;
  uniqueStudents: number;
  totalHoursTaught: number;
  hourlyRate: number;
}

export interface ITutorDashboardData {
  pieCharts: {
    bookingStatusDistribution: ITutorBookingStatusDistribution[];
    paymentStatusDistribution: ITutorPaymentStatusDistribution[];
    ratingDistribution: ITutorRatingDistribution[];
  };
  barCharts: {
    monthlyBookings: ITutorMonthlyBookings[];
    monthlyEarnings: ITutorMonthlyEarnings[];
  };
  lineCharts: {
    sessionTimeline: ITutorSessionTimeline[];
  };
  upcomingSessions: ITutorUpcomingSession[];
  topStudents: ITutorTopStudent[];
  stats: ITutorStats;
}
