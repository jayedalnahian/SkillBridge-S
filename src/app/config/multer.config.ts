// import { CloudinaryStorage } from "multer-storage-cloudinary";

// import multer from "multer";
// import { Request } from "express";
// import { cloudinaryUpload } from "./cloudinary.config.js";

// const storage = new CloudinaryStorage({
//     cloudinary: cloudinaryUpload,
//     params: async (req: Request, file: Express.Multer.File) => {
//         const originalName = file.originalname;
//         const extention = originalName.split(".").pop()?.toLocaleLowerCase();
//         const fileNameWithoutExtention = originalName
//             .split(".")
//             .slice(0, -1)
//             .join(".")
//             .toLocaleLowerCase()
//             .replace(/\s+/g, "_")
//             .replace(/[^a-z0-9\-]/g, "");

//         const uniqueName = Math.random().toString(36).substring(2) +
//             "_" +
//             Date.now().toString() +
//             "_" +
//             fileNameWithoutExtention;

//         const folder = extention === "pdf" ? "pdfs" : "images";

//         return {
//             folder: `ph_healthcare/${folder}`,
//             public_id: uniqueName,
//             resource_type: "auto",
//         }
//     }
// });

// export const multerUpload = multer({storage})
