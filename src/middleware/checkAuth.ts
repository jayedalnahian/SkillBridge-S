/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";

import { envVars } from "../config/env";
import AppError from "../errorHalpers/AppError"; 
import { prisma } from "../app/lib/prisma";
import { cookieUtils } from "../app/utils/cookie";
import { jwtUtils } from "../app/utils/jwt";



export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Session Token Verification
        const sessionToken = cookieUtils.getCookie(req, "better_auth.session_token");


        if (!sessionToken) {
            throw new Error('Unauthorized access! No session token provided.');
        }
        console.log(" this is sessionToken", sessionToken)
        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date(),
                    }
                },
                include: {
                    user: true,
                }
            })
            console.log(" this is sessionExists", sessionExists)
            if (!sessionExists) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No session token provided.');
            }

            if (sessionExists && sessionExists.user) {
                const user = sessionExists.user;

                const now = new Date();
                const expiresAt = new Date(sessionExists.expiresAt)
                const createdAt = new Date(sessionExists.createdAt)

                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - now.getTime();
                const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

                if (percentRemaining < 20) {
                    res.setHeader('X-Session-Refresh', 'true');
                    res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
                    res.setHeader('X-Time-Remaining', timeRemaining.toString());

                    console.log("Session Expiring Soon!!");
                }

                // if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
                //     throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is not active.');
                // }

                if (user.isDeleted) {
                    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
                }

                if (authRoles.length > 0 && !authRoles.includes(user.role)) {
                    throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
                }


                req.user = {
                    userId: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    status: user.status,
                    emailVerified: user.emailVerified
                }

                console.log(" this is user 2", req.user)
            }

            const accessToken = cookieUtils.getCookie(req, 'accessToken');

            if (!accessToken) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
            }


        }

        //Access Token Verification
        const accessToken = cookieUtils.getCookie(req, 'accessToken');

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
        }

        if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data!.role as string)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }
        next()
    } catch (error: any) {
        next(error);
    }
};