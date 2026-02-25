import status from "http-status"
import AppError from "../../../errorHalpers/AppError"
import { auth } from "../../lib/auth"
import { IAuth } from "./auth.type"
import { UserStatus } from "../../../generated/prisma/enums"
import { IRequestUser } from "../../interface/requestUser.interface"
import { prisma } from "../../lib/prisma"

const registerUser = async (payload: IAuth, image: string) => {
    const { name, email, password } = payload
    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
            image
        }
    })
    return data

}

const loginUser = async (payload: IAuth) => {
    const { email, password } = payload
    const data = await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })

    if (data.user.status === UserStatus.BANNED) {
        throw new AppError(status.FORBIDDEN, "User is blocked")
    }

    if (data.user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User is softly deleted")
    }
    return data
}



const logoutUser = async (sessionToken: string) => {

    const result = await auth.api.signOut({
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`
        })
    })


    return result
}

const getMe = async (user: IRequestUser) => {
    const userData = await prisma.user.findUnique({
        where: {
            id: user.userId,
            isDeleted: false,
            status: UserStatus.ACTIVE
        },
        include: {
            tutor: true,
            admin: true,
            bookings: true,
            reviews: true
        }
    })
    return userData
}

export const AuthService = {
    registerUser,
    loginUser,
    logoutUser,
    getMe
}