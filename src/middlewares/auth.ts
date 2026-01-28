import { auth as betterAuth } from "../lib/auth"
import { NextFunction, Request, Response } from "express"
import { prisma } from "../lib/prisma";


export enum UserRole {
    STUDENT = "STUDENT",
    TUTOR = "TUTOR",
    ADMIN = "ADMIN"
}
export enum UserStatus {
    ACTIVE = "ACTIVE",
    BANNED = "BANNED"

}



declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: UserRole;
                status: string;
                emailVerified: boolean;
                userProfileId: string;
            }
        }
    }
}



const auth = (...roles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // get user session
            const session = await betterAuth.api.getSession({
                headers: req.headers as any
            })


            if (!session) {
                return res.status(401).json({
                    "success": false,
                    "message": "Session is missing",
                    "data": null
                })
            }



            const userProfile = await prisma.userProfile.findUnique({
                where: {
                    userId: session.user.id
                }
            })

            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    message: "User profile not found",
                    data: null
                })
            }


            if (userProfile.status === UserStatus.BANNED) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been banned",
                    data: null
                })
            }



            if (roles.length > 0 && !roles.includes(userProfile.role as UserRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied - Insufficient permissions",
                    data: null
                })
            }

            req.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: userProfile.role as UserRole,
                status: userProfile.status,
                emailVerified: session.user.emailVerified,
                userProfileId: userProfile.id
            }





            next()
        } catch (error) {

            next(error)
        }
    }
}



export default auth;