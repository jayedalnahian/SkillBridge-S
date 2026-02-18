import dotenv from "dotenv";

import status from "http-status";
import AppError from "../errorHalpers/AppError";


dotenv.config();

interface EnvConfig {
    PORT: string;
    NODE_ENV: string;
    DATABASE_URL: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
}


const loadEnvVariables = (): EnvConfig => {
    const requireEnvVariable = [
        "PORT",
        "DATABASE_URL",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET"
    ]

    requireEnvVariable.forEach((veriable) => {
        if (!process.env[veriable]) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${veriable} is required but not set in .env file`)
        }
    })
    return {
        PORT: process.env.PORT as string,
        NODE_ENV: process.env.NODE_ENV as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string
    }
}



export const envVars = loadEnvVariables()