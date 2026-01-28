import { prisma } from "../../lib/prisma";
import { AuthUser } from "./auth.types";


const getMe = async (user: AuthUser) => {
    const userData = await prisma.user.findUnique({
        where: {
            id: user.id
        }
    })


    const profileData = await prisma.userProfile.findUnique({
        where: {
            id: user.userProfileId
        }
    })

    const result = { userData, profileData }
    
    
    return result;
}



export const AuthService = { getMe }