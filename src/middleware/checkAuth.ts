import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { UserRole, UserStatus } from '../generated/prisma/enums';
import AppError from "../errorHalpers/AppError";
import { prisma } from "../app/lib/prisma";
import { cookieUtils } from "../app/utils/cookie";

export const checkAuth = (...authRoles: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Try cookie first, then fallback to Authorization header
        let rawSessionToken = cookieUtils.getCookie(req, "better-auth.session_token");

        if (!rawSessionToken) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                rawSessionToken = authHeader.slice(7);
            }
        }

        if (!rawSessionToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No session token provided.');
        }

        // better-auth cookie format is "token.signature" — only the token part is stored in DB
        const sessionToken = rawSessionToken.split(".")[0];

        const session = await prisma.session.findFirst({
            where: {
                token: sessionToken,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!session) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid or expired session.');
        }

        const user = session.user;

        if (user.status === UserStatus.BANNED) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is banned.');
        }

        if (user.isDeleted) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
        }

        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden! Insufficient permissions.');
        }

        req.user = {
            userId: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            status: user.status,
            emailVerified: user.emailVerified,
        };

        next();
    } catch (error: any) {
        next(error);
    }
};