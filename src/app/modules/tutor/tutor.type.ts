import z from "zod";
import { createTutorSchema } from "./tutor.validate";

export type ITutorPayload = z.infer<typeof createTutorSchema>;