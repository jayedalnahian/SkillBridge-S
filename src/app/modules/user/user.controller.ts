import { Request, Response } from "express"
import { catchAsync } from "../../../shared/catchAsync"
import { sendResponse } from "../../../shared/sendResponse"
import status from "http-status"
import { UserService } from "./user.service"
import { IQueryParams } from "../../interface/query.interface"




const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllUsers(req.query as IQueryParams);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Users fetched successfully",
        meta: result.meta,
        data: result.data,
        error: null,
    })
});



const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.updateUserStatus(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
        error: null,
    })
});


const deleteUser = catchAsync(async (req: Request, res: Response) => { 
    const result = await UserService.deleteUser(req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
        error: null,
    })
})





export const UserController = {
    getAllUsers,
    updateUserStatus,
    deleteUser
}