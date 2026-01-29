import { Request, Response } from "express"
import { availablityService } from './availability.service';
import { tutorService } from "../tutor/tutor.service";
import { AvailabilityFilterOptions } from "./availablity.types";







const createAvailabilityController = async (
    req: Request,
    res: Response
) => {
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

        const {
            dayOfWeek,
            startTime,
            endTime,
            duration,
            maxStudents,
            specificDate,
        } = req.body

        const availability = await availablityService.createAvailability({
            userProfileId,
            dayOfWeek,
            startTime,
            endTime,
            duration: Number(duration),
            ...(maxStudents !== undefined && { maxStudents: Number(maxStudents) }),
            ...(specificDate && { specificDate: new Date(specificDate) }),
        })

        res.status(201).json({
            success: true,
            message: "Availability slot created successfully",
            data: availability,
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


const deleteAvailabilityController = async (
    req: Request,
    res: Response
) => {
    try {
        const userProfileId = req.user?.userProfileId
        const availabilityId = req.params.id

        if (!userProfileId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
                error: "No userProfileId found",
            })
        }

        if (!availabilityId) {
            return res.status(400).json({
                success: false,
                message: "Availability ID is required",
                data: null,
                error: "No availability ID provided",
            })
        }

        const result = await availablityService.deleteAvailability(
            userProfileId,
            availabilityId as string
        )

        res.status(200).json({
            success: true,
            message: "Availability slot deleted successfully",
            data: result,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete availability slot",
            data: null,
            error: error.message || error,
        })
    }
}









const getTutorAvailabilityController = async (req: Request, res: Response) => {
    try {
        const tutorProfileId = req.params.id

        if (!tutorProfileId) {
            return res.status(400).json({
                success: false,
                message: "Tutor profile ID is required",
                data: null,
                error: "Missing tutorProfileId",
            })
        }

        const availability = await availablityService.getTutorAvailability(tutorProfileId as string)

        res.status(200).json({
            success: true,
            message: "Tutor availability retrieved successfully",
            data: availability,
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








export const AvailablityController = {  getTutorAvailabilityController, deleteAvailabilityController, createAvailabilityController }