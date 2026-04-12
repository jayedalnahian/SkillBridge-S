import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { UserRole, UserStatus } from "../generated/prisma";
import AppError from "../errorHalpers/AppError";
import { prisma } from "../lib/prisma";
import { cookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";
import { envVars } from "../config/env";

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let sessionToken = cookieUtils.getCookie(
        req,
        "better-auth.session_token",
      );
      if (!sessionToken) {
        throw new Error("Unauthorized access! No session token provided.");
      }

      if (sessionToken) {
        const sessionExists = await prisma.session.findUnique({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (sessionExists && sessionExists.user) {
          const user = sessionExists.user;

          const now = new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);

          const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
          const timeRemaining = expiresAt.getTime() - now.getTime();
          const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

          if (percentRemaining < 20) {
            res.setHeader("X-Session-Refresh", "true");
            res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
            res.setHeader("X-Time-Remaining", timeRemaining.toString());

            console.log("Session Expiring Soon!!");
          }

          if (user.status === UserStatus.BANNED) {
            throw new AppError(status.FORBIDDEN, "User is blocked");
          }

          if (user.isDeleted) {
            throw new AppError(status.NOT_FOUND, "User is softly deleted");
          }

          if (user.needPasswordChange) {
            throw new AppError(
              status.FORBIDDEN,
              "User needs to change password",
            );
          }

          if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(
              status.FORBIDDEN,
              "Forbidden access! You do not have permission to access this resource.",
            );
          }

          req.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            status: user.status,
          };
        }

        const accessToken = cookieUtils.getCookie(req, "accessToken");

        if (!accessToken) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! No access token provided.",
          );
        }
      }

      //Access Token Verification
      const accessToken = cookieUtils.getCookie(req, "accessToken");

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token provided.",
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! Invalid access token.",
        );
      }

      if (
        authRoles.length > 0 &&
        !authRoles.includes(verifiedToken.data!.role as UserRole)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
