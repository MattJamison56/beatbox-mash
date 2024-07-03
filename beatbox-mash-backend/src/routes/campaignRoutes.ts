import express from 'express';
import { createCampaign, deleteCampaign, getCampaigns } from '../controllers/campaignController';

const router = express.Router();

router.get('/', getCampaigns);
router.post('/create', createCampaign);
router.post('/delete', deleteCampaign);

export default router;
