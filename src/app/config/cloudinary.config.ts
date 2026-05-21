// import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
// import { envVars } from "./env.js";
// import AppError from "../errorHalpers/AppError.js";
// import status from "http-status";

// cloudinary.config({
//     cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
//     api_key: envVars.CLOUDINARY_API_KEY,
//     api_secret: envVars.CLOUDINARY_API_SECRET,
// })

// export const cloudinaryUpload = cloudinary;



// export const uploadFileToCloudinary = async (buffer: Buffer, fileName: string): Promise<UploadApiResponse> => {
//     if (!buffer || !fileName) {
//         throw new AppError(status.BAD_REQUEST, "Buffer and file name are required")
//     }

//     const extention = fileName.split(".").pop()?.toLocaleLowerCase();
//     const fileNameWithoutExtention = fileName
//         .split(".")
//         .slice(0, -1)
//         .join(".")
//         .toLocaleLowerCase()
//         .replace(/\s+/g, "_")
//         .replace(/[^a-z0-9\-]/g, "");

//     const uniqueName = Math.random().toString(36).substring(2) +
//         "_" +
//         Date.now().toString() +
//         "_" +
//         fileNameWithoutExtention;

//     const folder = extention === "pdf" ? "pdfs" : "images";
//     return new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream({
//             resource_type: "auto",
//             folder: `ph-healthcare/${folder}`,
//             public_id: uniqueName,
//         },
//             (error, result) => {
//                 if (error) {
//                     reject(new AppError(status.BAD_REQUEST, "Failed to upload file to cloudinary"))
//                 } else {
//                     resolve(result as UploadApiResponse)
//                 }
//             }
//         ).end(buffer)
//     })
// }


// export const deleteFileFromCloudinary = async (url: string) => {
//     try {
//         const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
//         const match = url.match(regex)
//         if (match && match[1]) {
//             const publicID = match[1]
//             await cloudinary.uploader.destroy(
//                 publicID,
//                 {
//                     resource_type: "image"
//                 }
//             )

//             console.log(`File ${publicID} deleted from cloudinary`)
//         }
//     } catch (error) {
//         console.log(error)
//         throw new AppError(status.BAD_REQUEST, "Failed to delete file from cloudinary")
//     }
// }
