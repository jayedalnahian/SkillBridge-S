import { Request, Response } from "express"
import { tutorService } from "./tutor.service"
import paginationSortingHelper from "../../helpers/paginationSortingHelper"
import { UpdateTutorProfileInput } from "./tutor.types"

const getTutors = async (req: Request, res: Response) => {
    try {
        const {
            userId,
            search,
            categoryId,
            minPrice,
            maxPrice,
            minRating,
            sortBy,
            sortOrder,
        } = req.query

        const { page, limit, skip } = paginationSortingHelper(req.query)

        // -------------------------
        // BUILD PAYLOAD SAFELY
        // -------------------------
        const payload: any = {
            userId,
            page,
            limit,
            skip,
            sortBy: typeof sortBy === "string" ? sortBy : "createdAt",
            sortOrder: typeof sortOrder === "string" ? sortOrder : "desc",
        }

        if (typeof search === "string") {
            payload.searchString = search
        }

        if (typeof categoryId === "string") {
            payload.categoryId = categoryId
        }

        if (minPrice !== undefined) {
            payload.minPrice = Number(minPrice)
        }

        if (maxPrice !== undefined) {
            payload.maxPrice = Number(maxPrice)
        }

        if (minRating !== undefined) {
            payload.minRating = Number(minRating)
        }

        const result = await tutorService.getTutors(payload)

        res.status(200).json({
            success: true,
            message: "Tutors retrieved successfully",
            meta: result.meta,
            data: result.data,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve tutors",
            data: null,
            error,
        })
    }
}



const applyForTutor = async (req: Request, res: Response) => {
    try {
        const { bio, hourlyRate, experience } = req.body
        const userProfileId = req.user?.userProfileId // assuming middleware sets req.user

        if (!userProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "No userProfileId found",
            })
        }

        const tutorProfile = await tutorService.applyForTutor({
            userProfileId,
            bio,
            hourlyRate: Number(hourlyRate),
            experience: Number(experience),
        })

        res.status(201).json({
            success: true,
            message: "Tutor application submitted successfully",
            data: tutorProfile,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}





const updateTutorProfile = async (req: Request, res: Response) => {
    try {
        // 1️⃣ Get userProfileId from auth middleware
        const userProfileId = req.user?.userProfileId
        if (!userProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "No userProfileId found",
            })
        }

        // 2️⃣ Get fields from request body
        const { bio, hourlyRate, experience, categoryIds } = req.body

        // 3️⃣ Build update payload safely (avoids exactOptionalPropertyTypes error)
        const updateData: UpdateTutorProfileInput = {
            tutorProfileId: userProfileId,
            ...(bio !== undefined && { bio }),
            ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
            ...(experience !== undefined && { experience: Number(experience) }),
            ...(categoryIds !== undefined && { categoryIds }),
        }

        // 4️⃣ Call service
        const updatedTutor = await tutorService.updateTutorProfile(updateData)

        // 5️⃣ Return response
        res.status(200).json({
            success: true,
            message: "Tutor profile updated successfully",
            data: updatedTutor,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}



const getTutorApplicationStatus = async (req: Request, res: Response) => {
    try {
        const userProfileId = req.user?.userProfileId

        if (!userProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "No userProfileId found",
            })
        }

        const status = await tutorService.getTutorApplicationStatus(userProfileId)

        res.status(200).json({
            success: true,
            message: "Application status retrieved successfully",
            data: { status },
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}




const approveTutor = async (req: Request, res: Response) => {
    try {
        const userProfileId = req.params.id
        if (!userProfileId) {
            return res.status(400).json({
                success: false,
                message: "UserProfileId is required",
                data: null,
                error: "Missing id param",
            })
        }

        const updatedTutor = await tutorService.approveTutor(userProfileId as string)

        res.status(200).json({
            success: true,
            message: "Tutor approved successfully",
            data: updatedTutor,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
            data: null,
            error,
        })
    }
}






export const tutorController = { getTutors, approveTutor, applyForTutor, getTutorApplicationStatus, updateTutorProfile }