import { Router } from "express";
import { createAd, deleteAd, getAds } from "../controllers/adController";
const verifyToken = require("../middleware/auth");

const router = Router();

router.post("/ads", createAd);
router.get("/ads", getAds);
router.delete("/ads/:id", deleteAd);


export default router;
