import { Prisma } from "../../generated/prisma/client.js";

// Admin model type
export type Admin = Prisma.AdminGetPayload<{}>;

// Admin with relations
export type AdminWithRelations = Prisma.AdminGetPayload<{
  include: {
    User: true;
  };
}>;

// Admin query params interface
export interface IAdminQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

// Admin payload for creation
export interface IAdminPayload {
  password: string;
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
  };
}

// Admin payload for update
export interface IAdminUpdatePayload {
  name?: string;
  email?: string;
  profilePhoto?: string;
  contactNumber?: string;
  address?: string;
}

// Dashboard Analytics Types

export interface IUserRoleDistribution {
  role: string;
  count: number;
}

export interface IUserStatusDistribution {
  status: string;
  count: number;
}

export interface IBookingStatusDistribution {
  status: string;
  count: number;
}

export interface IPaymentStatusDistribution {
  status: string;
  count: number;
}

export interface ITutorStatusDistribution {
  status: string;
  count: number;
}

export interface IMonthlyRevenue {
  month: string;
  revenue: number;
}

export interface IMonthlyBookings {
  month: string;
  bookings: number;
}

export interface IMonthlyRegistrations {
  month: string;
  students: number;
  tutors: number;
  total: number;
}

export interface ITopCategory {
  name: string;
  tutorCount: number;
}

export interface ITutorExperienceDistribution {
  range: string;
  count: number;
}

export interface IHourlyRateDistribution {
  range: string;
  count: number;
}

export interface IPlatformGrowth {
  month: string;
  totalUsers: number;
  students: number;
  tutors: number;
}

export interface IRevenueTrend {
  month: string;
  cumulativeRevenue: number;
  monthlyRevenue: number;
}

export interface IBookingVolume {
  date: string;
  count: number;
}

export interface IAdminStats {
  totalPlatformRevenue: number;
  totalActiveBookings: number;
  averageTutorRating: number | null;
  totalCategories: number;
  averageSessionDuration: number | null;
  totalStudents: number;
  totalTutors: number;
  totalAdmins: number;
  totalUsers: number;
}

export interface IAdminDashboardData {
  pieCharts: {
    userRoleDistribution: IUserRoleDistribution[];
    userStatusDistribution: IUserStatusDistribution[];
    bookingStatusDistribution: IBookingStatusDistribution[];
    paymentStatusDistribution: IPaymentStatusDistribution[];
    tutorStatusDistribution: ITutorStatusDistribution[];
  };
  barCharts: {
    monthlyRevenue: IMonthlyRevenue[];
    monthlyBookings: IMonthlyBookings[];
    monthlyRegistrations: IMonthlyRegistrations[];
    topCategories: ITopCategory[];
    tutorExperienceDistribution: ITutorExperienceDistribution[];
    hourlyRateDistribution: IHourlyRateDistribution[];
  };
  areaCharts: {
    platformGrowth: IPlatformGrowth[];
    revenueTrend: IRevenueTrend[];
    bookingVolume: IBookingVolume[];
  };
  stats: IAdminStats;
}
