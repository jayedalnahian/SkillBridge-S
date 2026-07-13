import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { Request, Response } from "express";
import { MessageService } from "./message.service.js";

const createMessage = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await MessageService.createMessage(payload);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Message sent successfully",
        data: result,
        error: null,
    });
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
    const result = await MessageService.getAllMessages();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Messages fetched successfully",
        data: result,
        error: null,
    });
});

export const MessageController = {
    createMessage,
    getAllMessages,
};
