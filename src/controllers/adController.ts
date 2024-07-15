import { Request, Response } from "express";
import CreateAds from "../models/CreateAds";

// Create an Ad
export const createAd = async (req: Request, res: Response) => {
  try {
    const {
      ShopId,
      image_link,
      add_text,
      url_link,
      created_Date,
      status,
      ad_StartDate,
      ad_EndDate,
    } = req.body;

    // Create Ad
    const newAd = new CreateAds({
      ShopId,
      image_link,
      add_text,
      url_link,
      created_Date,
      status,
      ad_StartDate,
      ad_EndDate,
    });

    const savedAd = await newAd.save();
    res.status(200).json({ message: "Ad created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create ad" });
    console.log(error);
  }
};

// Ftech an Ad
export const getAds = async (req: Request, res: Response) => {
  try {
    const ads = await CreateAds.aggregate([{$sample: {size: 5}}]);
    res.status(200).json({ message: "Ads fetched Successfully" });
  } catch (error) {
    console.error("Failed to fetch ads:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
};

// Delete an Ad
export const deleteAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ad = await CreateAds.findByIdAndDelete(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete ad" });
  }
};
