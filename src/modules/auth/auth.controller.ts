import { Request, Response } from "express"
import { AuthService } from "./auth.service"
import { AuthUser } from "./auth.types"
import { auth as betterAuth } from "../../lib/auth";


const getMe = async (req: Request, res: Response) => {
    try {
        const result = await AuthService.getMe(req.user as AuthUser)
        res.status(200).json({
            success: true,
            message: "data retrived successfully",
            data: result,
            error: null
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrorng in the server.",
            data: null,
            error: error
        })
    }
}



const logOut = async (req: Request, res: Response) => {
    try {


        await betterAuth.api.signOut({
            headers: req.headers as any,
        });
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
            data: null,
            error: null,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Logout failed",
            data: null,
            error,
        });
    }
}




export const AuthController = { getMe, logOut }