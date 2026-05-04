import { z } from "zod";

export const createAdminSchema = z.object({
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    ),
  admin: z.object({
    name: z.string("Name is required"),
    email: z.email("Invalid email format"),
    profilePhoto: z.string().optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const updateAdminSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  profilePhoto: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
});
