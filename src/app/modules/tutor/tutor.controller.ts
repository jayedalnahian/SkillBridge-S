import status from "http-status"
import { sendResponse } from "../../../shared/sendResponse"
import { catchAsync } from "../../../shared/catchAsync"
import { Request, Response } from "express"
import { TutorService } from "./tutor.service"
import { IQueryParams } from "../../interface/query.interface"
import { ITutorPayload } from "./tutor.type"
import AppError from "../../../errorHalpers/AppError"


const getAllTutors = catchAsync(async (req: Request, res: Response) => {
    const result = await TutorService.getAllTutors(req.query as IQueryParams)
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Tutor fetched successfully",
        data: result,
        error: null,
    })
})

const getSingleTutor = catchAsync(async (req: Request, res: Response) => {
    const result = await TutorService.getSingleTutor(req.params.id as string)
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Tutor fetched successfully",
        data: result,
        error: null,
    })
})

const createTutor = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError(status.BAD_REQUEST, "Tutor image is required")
    }

    const result = await TutorService.createTutor(req.body as ITutorPayload, req.file.path)
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Tutor created successfully",
        data: result,
        error: null,
    })
})

export const TutorController = {
    getAllTutors,
    getSingleTutor,
    createTutor
}