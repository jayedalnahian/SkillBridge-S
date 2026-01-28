import { Request, Response } from "express"
import { tutorService } from "./tutor.service"
import paginationSortingHelper from "../../helpers/paginationSortingHelper"

const getTutors = async (req: Request, res: Response) => {
    try {
        const {
            search,
            categoryId,
            minPrice,
            maxPrice,
            minRating,
            sortBy,
            sortOrder,
        } = req.query

        const { page, limit, skip } = paginationSortingHelper(req.query)

        // -------------------------
        // BUILD PAYLOAD SAFELY
        // -------------------------
        const payload: any = {
            page,
            limit,
            skip,
            sortBy: typeof sortBy === "string" ? sortBy : "createdAt",
            sortOrder: typeof sortOrder === "string" ? sortOrder : "desc",
        }

        if (typeof search === "string") {
            payload.searchString = search
        }

        if (typeof categoryId === "string") {
            payload.categoryId = categoryId
        }

        if (minPrice !== undefined) {
            payload.minPrice = Number(minPrice)
        }

        if (maxPrice !== undefined) {
            payload.maxPrice = Number(maxPrice)
        }

        if (minRating !== undefined) {
            payload.minRating = Number(minRating)
        }

        const result = await tutorService.getTutors(payload)

        res.status(200).json({
            success: true,
            message: "Tutors retrieved successfully",
            meta: result.meta,
            data: result.data,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve tutors",
            data: null,
            error,
        })
    }
}



export const tutorController = { getTutors }