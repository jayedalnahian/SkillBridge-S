import status from "http-status"
import AppError from "../../../errorHalpers/AppError"
import { Category, Prisma, Tutor, UserRole } from "../../../generated/prisma/client"
import { IQueryParams } from "../../interface/query.interface"
import { prisma } from "../../lib/prisma"
import { QueryBuilder } from "../../utils/QueryBuilder"
import { tutorFilterableFields, tutorIncludeConfig, tutorSearchableFields } from "./tutor.constent"
import { ITutorPayload } from "./tutor.type"
import { auth } from "../../lib/auth"


const getAllTutors = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Tutor, Prisma.TutorWhereInput, Prisma.TutorInclude>(
        prisma.tutor,
        query,
        {
            searchableFields: tutorSearchableFields,
            filterableFields: tutorFilterableFields
        }
    )

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false
        })
        .dynamicInclude(tutorIncludeConfig)
        .paginate()
        .fields()
        .sort()
        .execute()

    return result
}


const getSingleTutor = async (id: string) => {
    const result = await prisma.tutor.findUnique({
        where: { id },
        include: tutorIncludeConfig
    })

    return result
}


const createTutor = async (payload: ITutorPayload, profilePhoto: string) => {

    const categories: Category[] = []

    for (const categoryId of payload.categories) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        })

        if (!category) {
            throw new AppError(status.BAD_REQUEST, `Category with id ${categoryId} not found.`)
        }
        categories.push(category)
    }

    const userExists = await prisma.user.findUnique({
        where: {
            email: payload.tutor.email
        }
    })

    if (userExists) {
        throw new AppError(status.FORBIDDEN, "User with this email already exists.")
    }


    const userData = await auth.api.signUpEmail({
        body: {
            email: payload.tutor.email,
            name: payload.tutor.name,
            password: payload.password,
            role: UserRole.TUTOR,
        }
    })

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { availabilityStartTime, availabilityEndTime, ...otherTutorData } = payload.tutor;
            const tutorData = await tx.tutor.create({
                data: {
                    ...otherTutorData,
                    userId: userData.user.id,
                    profilePhoto: profilePhoto,
                    availabilityStartTime: new Date(availabilityStartTime),
                    availabilityEndTime: new Date(availabilityEndTime)
                }
            })

            const tutorCategoryData = categories.map((category) => {
                return {
                    tutorId: tutorData.id,
                    categoryId: category.id
                }
            })

            await tx.tutorCategory.createMany({
                data: tutorCategoryData
            })

            const tutor = await tx.tutor.findUnique({
                where: {
                    id: tutorData.id
                },
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    educationLevel: true,
                    experienceYears: true,
                    hourlyRate: true,
                    availableDays: true,
                    availabilityStartTime: true,
                    availabilityEndTime: true,
                    tutorCategory: {
                        select: {
                            categoryId: true
                        }
                    },





                    isDeleted: true,
                    deletedAt: true,
                    createdAt: true,
                    updatedAt: true,
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            status: true,
                            emailVerified: true,
                            image: true,
                            isDeleted: true,
                            deletedAt: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                }
            })

            return tutor;
        })
        return result;

    } catch (error) {
        console.log("Transaction error: ", error);
        await prisma.user.delete({
            where: {
                id: userData.user.id
            }


        })

        throw error;
    }
}


export const TutorService = { getAllTutors, getSingleTutor, createTutor }