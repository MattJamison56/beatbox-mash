import express from 'express';
import { createCampaign, deleteCampaign, getCampaigns, updateCampaign, updateCampaignTeams } from '../controllers/campaignController';

const router = express.Router();

router.get('/', getCampaigns);
router.post('/create', createCampaign);
router.post('/delete', deleteCampaign);
router.put('/update', updateCampaign); // Add this line for updating a campaign
router.post('/updatecampaignteams', updateCampaignTeams); // Add this line for updating campaign teams

export default router;
