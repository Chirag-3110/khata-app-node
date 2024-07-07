import { Router } from 'express';
import { createAd, getAdById, deleteAd } from '../controllers/adController';

const router = Router();

router.post('/ads', createAd);
router.get('/ads/:id', getAdById);
router.delete('/ads/:id', deleteAd);

export default router;
