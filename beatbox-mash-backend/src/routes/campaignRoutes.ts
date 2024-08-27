import express from 'express';
import { createCampaign, deleteCampaign, getCampaigns, updateCampaign, updateCampaignTeams, getCampaignByName, getCampaignById } from '../controllers/campaignController';

const router = express.Router();

router.get('/', getCampaigns);
router.post('/create', createCampaign);
router.post('/delete', deleteCampaign);
router.post('/update', updateCampaign); // Add this line for updating a campaign
router.post('/updatecampaignteams', updateCampaignTeams); // Add this line for updating campaign teams
router.get('/name/:name', getCampaignByName);
router.get('/:id', getCampaignById);

export default router;
