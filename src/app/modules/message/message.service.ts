import status from "http-status";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHalpers/AppError.js";
import { IMessageCreateInput } from "./message.type.js";

const createMessage = async (payload: IMessageCreateInput) => {
    console.log(payload)
    const result = await prisma.message.create({
        data: {
            ...payload,
        },
    });
    return result;
};

const getAllMessages = async () => {
    const result = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
    });
    return result;
};

export const MessageService = {
    createMessage,
    getAllMessages,
};
