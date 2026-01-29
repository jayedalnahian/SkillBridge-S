import { auth as betterAuth } from "../lib/auth"
import { NextFunction, Request, Response } from "express"
import { prisma } from "../lib/prisma"

export enum UserRole {
    STUDENT = "STUDENT",
    TUTOR = "TUTOR",
    ADMIN = "ADMIN",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    BANNED = "BANNED",
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                name: string
                role: UserRole
                status: UserStatus
                emailVerified: boolean
                userProfileId: string
                tutorProfileId?: string | undefined
            }
        }
    }
}

const auth = (...roles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get user session
            const session = await betterAuth.api.getSession({
                headers: req.headers as any,
            })

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "Session is missing",
                    data: null,
                })
            }

            // Fetch user profile with tutor profile if exists
            const userProfile = await prisma.userProfile.findUnique({
                where: { userId: session.user.id },
                include: {
                    tutorProfile: {
                        select: { id: true }
                    }
                }
            })

            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    message: "User profile not found",
                    data: null,
                })
            }

            // Check if banned
            if (userProfile.status === UserStatus.BANNED) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been banned",
                    data: null,
                })
            }

            // Check roles if specified
            if (roles.length && !roles.includes(userProfile.role as UserRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied - Insufficient permissions",
                    data: null,
                })
            }

            // Attach user to request
            req.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: userProfile.role as UserRole,
                status: userProfile.status as UserStatus,
                emailVerified: session.user.emailVerified,
                userProfileId: userProfile.id,
                tutorProfileId: userProfile.tutorProfile?.id  // Add tutor profile ID
            }

            next()
        } catch (error) {
            console.error("Auth middleware error:", error)
            res.status(500).json({
                success: false,
                message: "Internal server error in authentication",
                data: null,
                error,
            })
        }
    }
}

export default auth