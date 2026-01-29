import { Request, Response } from "express"
import { userService } from "./user.service"

const getAllUser = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            search,
            role,
            status,
            page = 1,
            limit = 10,
            sortBy,
            sortOrder = "desc",
        } = req.query

        const pageNumber = Number(page)
        const limitNumber = Number(limit)
        const skip = (pageNumber - 1) * limitNumber

        const result = await userService.getAllUsers({
            searchString: search as string,
            role: role as any,
            status: status as any,
            page: pageNumber,
            limit: limitNumber,
            skip,
            sortBy: sortBy as string,
            sortOrder: sortOrder as any,
        })

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result,
            error: null,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong on the server",
            data: null,
            error,
        })
    }
}

const updateUserStatus = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.params.id as string

        const result = await userService.updateUserStatus({ userId })

        res.status(200).json({
            success: true,
            message: `User ${result.status === "BANNED" ? "banned" : "unbanned"
                } successfully`,
            data: result,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong on the server",
            data: null,
            error,
        })
    }
}



const getStudentDashboardController = async (
    req: Request,
    res: Response
) => {
    try {
        const studentProfileId = req.user?.userProfileId

        if (!studentProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Student profile not found",
            })
        }

        const stats = await userService.getStudentDashboardStats(
            studentProfileId
        )

        res.status(200).json({
            success: true,
            message: "Student dashboard stats retrieved successfully",
            data: stats,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}



const getTutorDashboardController = async (
    req: Request,
    res: Response
) => {
    try {
        const tutorProfileId = req.user?.userProfileId

        if (!tutorProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "Tutor profile not found",
            })
        }

        const stats = await userService.getTutorDashboardStats(tutorProfileId)

        res.status(200).json({
            success: true,
            message: "Tutor dashboard stats retrieved successfully",
            data: stats,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}



const getAdminDashboardController = async (
    req: Request,
    res: Response
) => {
    try {
        const stats = await userService.getAdminDashboardStats()

        res.status(200).json({
            success: true,
            message: "Admin dashboard stats retrieved successfully",
            data: stats,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}


const getPendingTutorsController = async (
    req: Request,
    res: Response
) => {
    try {
        const tutors = await userService.getPendingTutors()

        res.status(200).json({
            success: true,
            message: "Pending tutor applications retrieved successfully",
            data: tutors,
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}

export const userController = { getPendingTutorsController, getAdminDashboardController, getTutorDashboardController, getStudentDashboardController,getAllUser, updateUserStatus }