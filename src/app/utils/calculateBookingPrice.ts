import status from "http-status";
import AppError from "../errorHalpers/AppError.js";
import { prisma } from "../lib/prisma.js";

const calculateBookingPrice = async ({tutorid, durationMinutes}: {tutorid: string, durationMinutes: number}) => {
    try {
        const tutor = await prisma.tutor.findUnique({
            where: {
                id: tutorid,
                isDeleted: false
            }
        });
        
        if (!tutor) {
            throw new AppError(status.NOT_FOUND, "Tutor not found or has been deleted");
        }
        
        const price = tutor.hourlyRate * (durationMinutes / 60);
        return price;
    } catch (error) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to calculate booking price");
    }
}

export default calculateBookingPrice;