import { prisma } from "../../lib/prisma"
import { CreateCategoryInput, UpdateCategoryInput } from "./category.types"
import { generateSlug } from "./category.utils"


const getAllCategories = async () => {
    const result = await prisma.category.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            displayOrder: "asc",
        },
        select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
            displayOrder: true,
        },
    })

    return result
}



const createNewCategory = async (data: CreateCategoryInput) => {
    // -------------------------
    // CHECK NAME UNIQUENESS
    // -------------------------
    const existingCategory = await prisma.category.findUnique({
        where: { name: data.name },
    })

    if (existingCategory) {
        throw new Error("Category with this name already exists")
    }

    // -------------------------
    // GENERATE UNIQUE SLUG
    // -------------------------
    const baseSlug = generateSlug(data.name)
    let slug = baseSlug
    let suffix = 1

    while (
        await prisma.category.findUnique({
            where: { slug },
        })
    ) {
        slug = `${baseSlug}-${suffix}`
        suffix++
    }

    // -------------------------
    // DISPLAY ORDER
    // -------------------------
    let displayOrder = data.displayOrder

    if (!displayOrder) {
        const maxOrder = await prisma.category.aggregate({
            _max: {
                displayOrder: true,
            },
        })

        displayOrder = (maxOrder._max.displayOrder ?? 0) + 1
    }

    // -------------------------
    // CREATE CATEGORY
    // -------------------------
    const result = await prisma.category.create({
        data: {
            name: data.name,
            slug,
            description: data.description ?? null,
            icon: data.icon ?? null,
            displayOrder,
            isActive: true,
        },
    })


    return result
}




const updateCategory = async (data: UpdateCategoryInput, categoryId: string) => {
    let finalData
    if (data.name) {
        const slug = generateSlug(data.name)
        finalData = { ...data, slug }
    }


    if (finalData) {
        const result = await prisma.category.update({
            where: {
                id: categoryId
            },
            data: finalData
        })
        return result;
    }
    return {}
}


const deleteCategory = async (categoryId: string) => {
    const categoryData = await prisma.category.findUnique({
        where: { id: categoryId },
    })

    if (!categoryData) {
        throw new Error("CATEGORY_NOT_FOUND")
    }

    return prisma.category.delete({
        where: { id: categoryId },
    })
}







export const categoryService = { getAllCategories, createNewCategory, updateCategory, deleteCategory }