import { Router } from "express";
import { statsController } from "./stats.controller.js";

const router = Router()

router.get("/hero-stats", statsController.heroStats)


export const statsRoute = router