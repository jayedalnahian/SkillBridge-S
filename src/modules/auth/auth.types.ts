import { UserRole } from "../../middlewares/auth";

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
    emailVerified: boolean;
    userProfileId: string;
};