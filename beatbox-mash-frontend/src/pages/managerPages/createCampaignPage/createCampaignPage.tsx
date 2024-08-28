/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button, TextField, Autocomplete, Switch, FormControlLabel, Typography, Box, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router-dom';

interface CreateCampaignPageProps {
  onBackToCampaigns: () => void;
  campaign?: any;
}

interface Product {
  ProductID: number;
  ProductName: string;
  Barcode: string;
  MSRP: number;
  ProductGroup: string;
}

interface Manager {
  id: number;
  name: string;
}

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 'bold',
  color: '#6f65ac',
}));

const CreateCampaignPage: React.FC<CreateCampaignPageProps> = ({ onBackToCampaigns, campaign }) => {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState(campaign?.name || '');
  const [owners, setOwners] = useState<string[]>(Array.isArray(campaign?.owners) ? campaign.owners : []);
  const [ownerIds, setOwnerIds] = useState<number[]>([]);
  const [teams, setTeams] = useState<string[]>(Array.isArray(campaign?.teams) ? campaign.teams : []);
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);
  const [reportTemplate, setReportTemplate] = useState(campaign?.report_template || '');
  const [preEventInstructions, setPreEventInstructions] = useState(campaign?.pre_event_instructions || '');
  const [firstBaInventory, setFirstBaInventory] = useState(campaign?.first_ba_inventory || false);
  const [firstBaPostEvent, setFirstBaPostEvent] = useState(campaign?.first_ba_post_event || false);
  const [subsequentBaInventory, setSubsequentBaInventory] = useState(campaign?.subsequent_ba_inventory || false);
  const [subsequentBaPostEvent, setSubsequentBaPostEvent] = useState(campaign?.subsequent_ba_post_event || false);
  const [baCheckInOut, setBaCheckInOut] = useState(campaign?.ba_check_in_out || false);
  const [photoCheckIn, setPhotoCheckIn] = useState(campaign?.photo_check_in || 'disabled');
  const [photoCheckOut, setPhotoCheckOut] = useState(campaign?.photo_check_out || 'disabled');
  const [showCheckPhotosInReport, setShowCheckPhotosInReport] = useState(campaign?.show_check_photos_in_report || false);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>(campaign?.products || []);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available teams
        const teamsResponse = await fetch('http://localhost:5000/teams');
        const teamsData = await teamsResponse.json();
        setAvailableTeams(teamsData.map((team: any) => team.name));

        // Fetch available products
        const productsResponse = await fetch('http://localhost:5000/products');
        const productsData = await productsResponse.json();
        setAvailableProducts(productsData);

        // Fetch available managers
        const managersResponse = await fetch('http://localhost:5000/managers');
        const managersData = await managersResponse.json();
        if (Array.isArray(managersData)) {
          setAvailableManagers(managersData.map((manager: any) => ({ id: manager.id, name: manager.name })));
        } else {
          console.error('Unexpected response format:', managersData);
        }

        // Fetch campaign details along with associated products
        if (campaign) {
          const campaignResponse = await fetch(`http://localhost:5000/campaigns/${campaign.id}`);
          const campaignData = await campaignResponse.json();

          setName(campaignData.name);
          setOwners(Array.isArray(campaignData.owners) ? campaignData.owners : [campaignData.owners]);
          setOwnerIds(Array.isArray(campaignData.owner_ids) ? campaignData.owner_ids : []);
          setReportTemplate(campaignData.report_template);
          setPreEventInstructions(campaignData.pre_event_instructions);
          setFirstBaInventory(campaignData.first_ba_inventory);
          setFirstBaPostEvent(campaignData.first_ba_post_event);
          setSubsequentBaInventory(campaignData.subsequent_ba_inventory);
          setSubsequentBaPostEvent(campaignData.subsequent_ba_post_event);
          setBaCheckInOut(campaignData.ba_check_in_out);
          setPhotoCheckIn(campaignData.photo_check_in);
          setPhotoCheckOut(campaignData.photo_check_out);
          setShowCheckPhotosInReport(campaignData.show_check_photos_in_report);
          setTeams([...new Set((campaignData.teams || []).filter(Boolean) as string[])]);
          setProducts(campaignData.products || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [campaign]);

  const handleSave = async () => {
    try {
      const url = campaign?.id ? `http://localhost:5000/campaigns/update` : `http://localhost:5000/campaigns/create`;
      const method = 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: campaign?.id,
          name, 
          owners, 
          owner_ids: ownerIds,
          report_template: reportTemplate, 
          pre_event_instructions: preEventInstructions,
          first_ba_inventory: firstBaInventory,
          first_ba_post_event: firstBaPostEvent,
          subsequent_ba_inventory: subsequentBaInventory,
          subsequent_ba_post_event: subsequentBaPostEvent,
          ba_check_in_out: baCheckInOut, 
          photo_check_in: photoCheckIn, 
          photo_check_out: photoCheckOut,
          show_check_photos_in_report: showCheckPhotosInReport, 
          teams, 
          products
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      onBackToCampaigns(); // Navigate back to campaigns page
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleOwnersChange = (_e: any, selectedOwners: string[]) => {
    setOwners(selectedOwners);
    const selectedOwnerIds = selectedOwners.map(ownerName => {
      const owner = availableManagers.find(manager => manager.name === ownerName);
      return owner ? owner.id : null;
    }).filter(id => id !== null) as number[];
    setOwnerIds(selectedOwnerIds);
  };

  const toggleProductModal = () => {
    setProductModalOpen(!productModalOpen);
  };

  const handleProductSelect = (selectedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.some(product => product.ProductID === selectedProduct.ProductID)
        ? prevProducts.filter(product => product.ProductID !== selectedProduct.ProductID)
        : [...prevProducts, selectedProduct]
    );
  };

  const handleRemoveAllProducts = () => {
    setProducts([]);
  };

  return (
    <div className="container" style={{ color: 'black' }}>
      <h1 className='title'>{id ? 'Update Campaign' : 'Create Campaign'}</h1>
      <form>
        <Section>
          <TextField
            label="Campaign Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Autocomplete
            multiple
            options={availableManagers.map(manager => manager.name)}
            value={owners}
            onChange={handleOwnersChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Owners"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Autocomplete
            multiple
            options={availableTeams}
            value={teams}
            onChange={(_e, value) => setTeams(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Teams"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Autocomplete
            options={['Post-Event Recap', 'Festival Recap']}
            value={reportTemplate}
            onChange={(_e, value) => setReportTemplate(value as string)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Report Template"
                fullWidth
                margin="normal"
                required
              />
            )}
          />
          <TextField
            label="Pre-Event Instructions"
            value={preEventInstructions}
            onChange={(e) => setPreEventInstructions(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
        </Section>

        <Divider />

        <Section>
          <SectionTitle variant="h6">Default Report Settings</SectionTitle>
          <Box display="flex" flexDirection="column">
            <Box display="flex" maxWidth="700px">
              <Typography variant="body1" gutterBottom>
                First BA that is added to event
              </Typography>
              <Box display="flex" flexDirection="column" padding="10px" marginLeft="auto">
                <FormControlLabel
                  control={<Switch checked={firstBaInventory} onChange={() => setFirstBaInventory(!firstBaInventory)} />}
                  label="Inventory"
                />
                <FormControlLabel
                  control={<Switch checked={firstBaPostEvent} onChange={() => setFirstBaPostEvent(!firstBaPostEvent)} />}
                  label="Post-event questions"
                />
              </Box>
            </Box>
            <Box display="flex" maxWidth="700px">
              <Typography variant="body1" gutterBottom>
                Subsequent BAs
              </Typography>
              <Box display="flex" flexDirection="column" padding="10px" marginLeft="auto">
                <FormControlLabel
                  control={<Switch checked={subsequentBaInventory} onChange={() => setSubsequentBaInventory(!subsequentBaInventory)} />}
                  label="Inventory"
                />
                <FormControlLabel
                  control={<Switch checked={subsequentBaPostEvent} onChange={() => setSubsequentBaPostEvent(!subsequentBaPostEvent)} />}
                  label="Post-event questions"
                />
              </Box>
            </Box>
          </Box>
        </Section>

        <Divider />

        <Section>
          <SectionTitle variant="h6">Campaign Products</SectionTitle>
          <Box display="flex" alignItems="center">
            <Button variant="outlined" onClick={toggleProductModal}>
              Select Products
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleRemoveAllProducts} style={{ marginLeft: '10px' }}>
              Remove All Products
            </Button>
          </Box>
          <Box marginTop={2}>
            <Typography variant="body2">
              Selected Products:
            </Typography>
            <TableContainer component={Paper} style={{ marginTop: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Barcode</TableCell>
                    <TableCell>MSRP</TableCell>
                    <TableCell>Group</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.ProductName}</TableCell>
                      <TableCell>{product.Barcode}</TableCell>
                      <TableCell>{product.MSRP}</TableCell>
                      <TableCell>{product.ProductGroup}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Section>

        <Divider />

        <Section>
          <SectionTitle variant="h6">Check In/Out Settings</SectionTitle>
          <Box display="flex" flexDirection="column">
            <FormControlLabel
              control={<Switch checked={baCheckInOut} onChange={() => setBaCheckInOut(!baCheckInOut)} />}
              label="BAs Can Check In/Out"
            />
            <TextField
              label="Photo Check In"
              select
              value={photoCheckIn}
              onChange={(e) => setPhotoCheckIn(e.target.value)}
              fullWidth
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="disabled">Disabled</option>
              <option value="optional">Optional</option>
              <option value="required">Required</option>
            </TextField>
            <TextField
              label="Photo Check Out"
              select
              value={photoCheckOut}
              onChange={(e) => setPhotoCheckOut(e.target.value)}
              fullWidth
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="disabled">Disabled</option>
              <option value="optional">Optional</option>
              <option value="required">Required</option>
            </TextField>
            <FormControlLabel
              control={<Switch checked={showCheckPhotosInReport} onChange={() => setShowCheckPhotosInReport(!showCheckPhotosInReport)} />}
              label="Show Check In/Out Photos in PDF Reports"
            />
          </Box>
        </Section>

        <Box display="flex" justifyContent="center" marginTop="20px">
          <Button variant="contained" color="primary" onClick={handleSave} style={{ margin: '10px' }}>
            {id ? 'Update Campaign' : 'Create Campaign'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={onBackToCampaigns} style={{ margin: '10px' }}>
            Cancel
          </Button>
        </Box>
      </form>

      {/* Product Selection Modal */}
      <Dialog open={productModalOpen} onClose={toggleProductModal} maxWidth="md" fullWidth>
        <DialogTitle>Select Products</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>Product Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox
                        checked={products.some(p => p.ProductID === product.ProductID)}
                        onChange={() => handleProductSelect(product)}
                      />
                    </TableCell>
                    <TableCell>{product.ProductName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleProductModal} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CreateCampaignPage;
