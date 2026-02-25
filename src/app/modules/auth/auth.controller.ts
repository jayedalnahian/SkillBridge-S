import { catchAsync } from "../../../shared/catchAsync"
import { Request, Response } from "express"
import { sendResponse } from "../../../shared/sendResponse"
import status from "http-status"
import { AuthService } from "./auth.service"
import AppError from "../../../errorHalpers/AppError"
import { cookieUtils } from "../../utils/cookie"
import { IRequestUser } from "../../interface/requestUser.interface"


const registerUser = catchAsync(async (req: Request, res: Response) => {

    if (!req.file?.path) {
        throw new AppError(status.BAD_REQUEST, "Image is required")
    }
    const result = await AuthService.registerUser(req.body, req.file?.path as string)
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User registered successfully",
        data: result,
        error: null,
    })
})



const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body)

    // Set the session cookie so subsequent requests are authenticated
    if (result.token) {
        cookieUtils.setCookie(res, "better-auth.session_token", result.token, {
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: "lax",
            path: "/",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
    }

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: result,
        error: null,
    })
})


const logoutUser = catchAsync(async (req: Request, res: Response) => {
    const rawSessionToken = req.cookies["better-auth.session_token"]
    if (!rawSessionToken) {
        throw new AppError(status.UNAUTHORIZED, "No session token found");
    }
    const result = await AuthService.logoutUser(rawSessionToken)


    cookieUtils.clearCookie(res, "better-auth.session_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    })

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        data: result,
        message: "User logged out successfully",
        error: null
    })
})


const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user
    const result = await AuthService.getMe(user as IRequestUser)

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User fetched successfully",
        data: result,
        error: null,
    })
})










export const AuthController = {
    registerUser,
    loginUser,
    logoutUser,
    getMe
}