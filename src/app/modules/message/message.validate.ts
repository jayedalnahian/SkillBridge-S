import z from "zod";

export const createMessageSchema = z.object({
    name: z.string("Name is required"),
    email: z.email("Invalid email"),
    subject: z.string("Subject is required"),
    body: z.string("Body is required"),
});
