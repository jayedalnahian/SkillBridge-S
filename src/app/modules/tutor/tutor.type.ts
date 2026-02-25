import z from "zod";
import { createTutorSchema, updateTutorSchema } from "./tutor.validate";

export type ITutorPayload = z.infer<typeof createTutorSchema>;
export type ITutorUpdatePayload = z.infer<typeof updateTutorSchema>