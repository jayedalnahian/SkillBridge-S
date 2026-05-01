import z from "zod";

export const updateStudentSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email("Invalid email format").optional(),
  profilePhoto: z.string().optional(),
  contactNumber: z.string().optional(),
  description: z.string().optional(),
});
