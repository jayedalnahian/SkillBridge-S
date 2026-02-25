import dotenv from "dotenv";

import status from "http-status";
import AppError from "../errorHalpers/AppError";


dotenv.config();

interface EnvConfig {
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    NODE_ENV: string;
    FRONTEND_URL: string;
}


const loadEnvVariables = (): EnvConfig => {
    const requireEnvVariable = [
        "PORT",
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "NODE_ENV",
        "FRONTEND_URL"
    ]

    requireEnvVariable.forEach((veriable) => {
        if (!process.env[veriable]) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${veriable} is required but not set in .env file`)
        }
    })
    return {
        PORT: process.env.PORT as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
        NODE_ENV: process.env.NODE_ENV as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string
    }
}



export const envVars = loadEnvVariables()