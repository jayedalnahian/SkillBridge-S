import { Router } from "express";
import prismaPkg from "../../generated/prisma/index.js";
import { MessageController } from "./message.controller.js";
import { createMessageSchema } from "./message.validate.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const { UserRole } = prismaPkg as any;

const router = Router();

router.post(
    "/",
    validateRequest(createMessageSchema),
    MessageController.createMessage,
);

router.get(
    "/",
    checkAuth(UserRole.ADMIN),
    MessageController.getAllMessages,
);

export const MessageRouter = router;
