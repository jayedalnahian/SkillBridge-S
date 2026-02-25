import z from "zod";

export const createCategorySchema = z.object({
    name: z.string("Name is required"),
    slug: z.string("Slug is required"),
    description: z.string("Description is required"),
})

