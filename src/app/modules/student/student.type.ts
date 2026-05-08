import z from "zod";
import { updateStudentSchema } from "./student.validation.js";

export interface IStudentCreateInput {
    userId: string;
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    description?: string;
}

export type IStudentUpdatePayload = z.infer<typeof updateStudentSchema>;

// Dashboard Analytics Types

export interface IStudentBookingStatusDistribution {
  status: string;
  count: number;
}

export interface IStudentPaymentStatusDistribution {
  status: string;
  count: number;
}

export interface IStudentMonthlyBookings {
  month: string;
  bookings: number;
}

export interface IStudentMonthlySpending {
  month: string;
  amount: number;
}

export interface IStudentUpcomingSession {
  id: string;
  tutorName: string;
  subject: string;
  startDateTime: string;
  duration: number;
  meetingLink: string | null;
}

export interface IStudentFavoriteTutor {
  id: string;
  name: string;
  subject: string;
  avgRating: number;
  totalSessions: number;
}

export interface IStudentSubjectDistribution {
  subject: string;
  count: number;
}

export interface IStudentSessionTimeline {
  date: string;
  completed: number;
  upcoming: number;
}

export interface IStudentStats {
  totalBookings: number;
  completedSessions: number;
  upcomingSessions: number;
  totalSpent: number;
  averageRatingGiven: number | null;
  totalReviews: number;
  uniqueTutors: number;
  totalHoursLearned: number;
}

export interface IStudentDashboardData {
  pieCharts: {
    bookingStatusDistribution: IStudentBookingStatusDistribution[];
    paymentStatusDistribution: IStudentPaymentStatusDistribution[];
    subjectDistribution: IStudentSubjectDistribution[];
  };
  barCharts: {
    monthlyBookings: IStudentMonthlyBookings[];
    monthlySpending: IStudentMonthlySpending[];
  };
  lineCharts: {
    sessionTimeline: IStudentSessionTimeline[];
  };
  upcomingSessions: IStudentUpcomingSession[];
  favoriteTutors: IStudentFavoriteTutor[];
  stats: IStudentStats;
}
