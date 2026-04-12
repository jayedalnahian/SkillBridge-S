import { Response } from "express"

interface IResponseData<T, E> {
    statusCode : number;
    success: boolean;
    message: string;
    data?: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
    error: E
}


export const sendResponse = <T, E>(res: Response, responseData: IResponseData<T, E>) => {
    const { statusCode, success, message, data, error, meta } = responseData
    res.status(statusCode).json({
        success,
        message,
        data,
        error,
        meta
    })

}