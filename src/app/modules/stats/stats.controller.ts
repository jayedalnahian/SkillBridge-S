import { Request, Response } from "express"
import { catchAsync } from "../../shared/catchAsync.js"
import { statsService } from "./stats.service.js"
import { sendResponse } from "../../shared/sendResponse.js"
import status from "http-status"


const heroStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await statsService.heroStats()

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Stats fetched successfully",
        data: stats,
        error: null,
    });
})

export const statsController = {
    heroStats,
}