import { Request, Response } from "express"
import { categoryService } from "./category.service"
import { CreateCategoryInput } from "./category.types"

const getAllCategories = async (req: Request, res: Response) => {
    try {
        const result = await categoryService.getAllCategories()

        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: result,
            error: null,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong on the server",
            data: null,
            error,
        })
    }
}




const createNewCategory = async (req: Request, res: Response) => {
    try {
        const data = req.body as CreateCategoryInput

        const result = await categoryService.createNewCategory(data)

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: result,
            error: null,
        })
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Something went wrong on the server",
            data: null,
            error,
        })
    }
}




const updateCategory = async (req: Request, res: Response) => {
    try {


        const categoryId = req.params.id as string
        const data = req.body
        console.log(data);
        const result = await categoryService.updateCategory(data, categoryId)
        res.status(200).json({
            success: true,
            message: "category updated successfully",
            data: result,
            error: null
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrorng in the server.",
            data: null,
            error: error
        })
    }
}



const deleteCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = req.params.id as string
        const result = await categoryService.deleteCategory(categoryId)
        res.status(200).json({
            success: true,
            message: "category deleted successfully",
            data: result,
            error: null
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong in the server.",
            data: null,
            error: (error as Error).message,
        })
    }
}



export const categoryController = { getAllCategories, createNewCategory, updateCategory, deleteCategory }