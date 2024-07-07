import { Request, Response } from 'express';
import CreateAds from '../models/CreateAds';


// Create an Ad
export const createAd = async (req: Request, res: Response) => {
    try {
        const { ShopId, image_link, add_text, url_link, created_Date, status, ad_StartDate, ad_EndDate } = req.body;

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
        res.status(201).json(savedAd);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ad' });
        console.log(error)
    }
};

// Get an Ad by ID
export const getAdById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ad = await CreateAds.findById(id).populate('ShopId');
        if (!ad) return res.status(404).json({ message: 'Ad not found' });

        res.status(200).json(ad);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ad' });
        console.log(error)
    }
};

// Delete an Ad
export const deleteAd = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find and delete the ad
        const ad = await CreateAds.findByIdAndDelete(id);
        if (!ad) return res.status(404).json({ message: 'Ad not found' });

        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete ad' });
    }
};
