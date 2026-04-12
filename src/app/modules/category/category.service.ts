
import status from "http-status";
import { prisma } from "../../lib/prisma"
import AppError from "../../errorHalpers/AppError";



export interface ICategoryCreateInput {
    name: string;
    slug: string;
    description: string;
    image: string;
}




const createCategory = async (payload: ICategoryCreateInput, image: string) => {
    const result = await prisma.category.create({
        data: {
            ...payload,
            image
        }
    })
    return result
}


const getAllCategories = async () => {
    const result = await prisma.category.findMany()
    return result
}






const deleteCategory = async (id: string) => {
    const isCategoryUsed = await prisma.tutor.findMany({
        where: {
            tutorCategory: {
                some: {
                    categoryId: id
                }
            }
        }
    })
    if (isCategoryUsed) {
        throw new AppError(status.BAD_REQUEST, "Category is in use by a tutor")
    }
    const result = await prisma.category.delete({
        where: {
            id
        }
    })
    return result
}

const updateCategory = async (id: string, payload: ICategoryCreateInput, image: string) => {
    await prisma.category.findFirstOrThrow({
        where: {
            id
        }
    })
    const isCategoryUsed = await prisma.tutor.findFirstOrThrow({
        where: {
            tutorCategory: {
                some: {
                    categoryId: id
                }
            }
        }
    })
    if (isCategoryUsed) {
        throw new AppError(status.BAD_REQUEST, "Category is in use by a tutor")
    }
    const result = await prisma.category.update({
        where: {
            id
        },
        data: {
            ...payload,
            image
        }
    })
    return result
}




export const CategoryService = {
    createCategory,
    getAllCategories,
    deleteCategory,
    updateCategory
}