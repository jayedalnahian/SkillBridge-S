import z from "zod";

export const registerUserSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long").max(100, "Name must be at most 100 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    image: z.string().optional(),
})

export const loginUserSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
})