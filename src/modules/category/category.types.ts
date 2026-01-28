
export interface CreateCategoryInput {
    name: string
    description?: string
    icon?: string
    displayOrder?: number
}



export interface UpdateCategoryInput {
    name?: string
    description?: string
    icon?: string
    displayOrder?: number
    isActive?: boolean
}

