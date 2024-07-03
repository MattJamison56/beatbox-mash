import express from 'express';
import { createCampaign, deleteCampaign, getCampaigns } from '../controllers/campaignController';

const router = express.Router();

router.post('/create', createCampaign);
router.post('/delete', deleteCampaign);
router.post('/', getCampaigns)

export default router;
