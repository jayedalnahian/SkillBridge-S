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
