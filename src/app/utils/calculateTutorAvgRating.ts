import { prisma } from "../lib/prisma.js"

export const calculateTutorAvgRating = async (tutorId: string): Promise<number> => {
    try {
        const reviews = await prisma.review.findMany({
            where: {
                tutorId: tutorId,
                isDeleted: false,
            },
            select: {
                rating: true,
            },
        });

        if (reviews.length === 0) {
            return 0;
        }

        const totalRating = reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Round to 2 decimal places
        return Math.round(averageRating * 100) / 100;
    } catch (error) {
        console.error("Error calculating tutor average rating:", error);
        return 0;
    }
};