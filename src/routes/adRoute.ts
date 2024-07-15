import { Router } from "express";
import { createAd, deleteAd, getAds } from "../controllers/adController";
const verifyToken = require("../middleware/auth");

const router = Router();

router.post("/ads", verifyToken, createAd);
router.get("/ads", verifyToken, getAds);
router.delete("/ads/:id", deleteAd);


export default router;
