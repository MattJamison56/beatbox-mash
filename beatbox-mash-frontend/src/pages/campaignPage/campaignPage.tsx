/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Menu, MenuItem, Switch } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import { EditTeamsForm } from '../../components/editTeamsForm/editTeamsForm';

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<null | any>(null);
  const [editTeamsOpen, setEditTeamsOpen] = useState(false);
  const [currentTeams, setCurrentTeams] = useState<string[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleEditTeams = (campaign: any) => {
    setCurrentTeams(campaign.teams || []);
    setCurrentCampaignId(campaign.id);
    setEditTeamsOpen(true);
  };

  const handleCloseEditTeams = () => {
    setEditTeamsOpen(false);
    setCurrentTeams([]);
    setCurrentCampaignId(null);
  };

  const handleSaveTeams = async (campaignId: string | null, newTeams: string[]) => {
    if (!campaignId) return;

    try {
      const response = await fetch(`http://localhost:5000/campaigns/updatecampaignteams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: campaignId, teams: newTeams }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setCampaigns(campaigns.map(campaign => campaign.id === campaignId ? { ...campaign, teams: newTeams } : campaign));
      await fetchCampaigns(); // reload table
    } catch (error) {
      console.error('Error updating teams:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:5000/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/teams')
      .then(response => response.json())
      .then(data => setTeams(data.map((team: any) => team.name)))
      .catch(error => console.error('Error fetching teams:', error));
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, campaign: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCampaign(null);
  };

  const handleView = () => {
    console.log('View campaign:', selectedCampaign);
    handleMenuClose();
  };


  const handleDeactivate = async () => {
    try {
      const response = await fetch(`http://localhost:5000/campaigns/deletecampaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedCampaign.id }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setCampaigns(campaigns.filter(campaign => campaign.id !== selectedCampaign.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error deactivating campaign:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className='title'>Campaigns</h1>
        <Button variant="contained" color="primary" onClick={() => navigate('/create-campaign')}>
          Create Campaign
        </Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Owners</TableCell>
              <TableCell>BA Can Schedule</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign, index) => (
              <TableRow key={index}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{campaign.teams ? `${campaign.teams}` : 'N/A'}
                  <IconButton onClick={() => handleEditTeams(campaign)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{campaign.owners}</TableCell>
                <TableCell>
                  <Switch checked={campaign.ba_can_schedule} disabled />
                </TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, campaign)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleView}>View</MenuItem>
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EditTeamsForm 
        open={editTeamsOpen} 
        onClose={handleCloseEditTeams} 
        currentTeams={currentTeams} 
        entityId={currentCampaignId} 
        teams={teams} 
        onSave={handleSaveTeams} 
      />
    </div>
  );
};

export default CampaignsPage;
