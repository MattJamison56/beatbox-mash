/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Autocomplete, Switch, FormControlLabel } from '@mui/material';

const CreateCampaignPage: React.FC = () => {
  const [name, setName] = useState('');
  const [owners, setOwners] = useState('');
  const [reportTemplate, setReportTemplate] = useState('');
  const [preEventInstructions, setPreEventInstructions] = useState('');
  const [firstBaInventory, setFirstBaInventory] = useState(false);
  const [firstBaPostEvent, setFirstBaPostEvent] = useState(false);
  const [subsequentBaInventory, setSubsequentBaInventory] = useState(false);
  const [subsequentBaPostEvent, setSubsequentBaPostEvent] = useState(false);
  const [baCanSchedule, setBaCanSchedule] = useState(false);
  const [baEditEventName, setBaEditEventName] = useState(false);
  const [baChangeVenue, setBaChangeVenue] = useState(false);
  const [baReschedule, setBaReschedule] = useState(false);
  const [baCheckInOut, setBaCheckInOut] = useState(false);
  const [photoCheckIn, setPhotoCheckIn] = useState('disabled');
  const [photoCheckOut, setPhotoCheckOut] = useState('disabled');
  const [showCheckPhotosInReport, setShowCheckPhotosInReport] = useState(false);
  const [timeDurationPresets, setTimeDurationPresets] = useState(false);
  const [allowBaToSchedule, setAllowBaToSchedule] = useState(false);
  const [overrideWage, setOverrideWage] = useState(false);
  const [excludeExpensesFromReport, setExcludeExpensesFromReport] = useState(false);
  const [hideBaContactInfo, setHideBaContactInfo] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/teams')
      .then(response => response.json())
      .then(data => setAvailableTeams(data.map((team: any) => team.name)))
      .catch(error => console.error('Error fetching teams:', error));

    fetch('http://localhost:5000/products')
      .then(response => response.json())
      .then(data => setAvailableProducts(data.map((product: any) => product.name)))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/campaigns/createcampaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name, owners, report_template: reportTemplate, pre_event_instructions: preEventInstructions,
          first_ba_inventory: firstBaInventory, first_ba_post_event: firstBaPostEvent,
          subsequent_ba_inventory: subsequentBaInventory, subsequent_ba_post_event: subsequentBaPostEvent,
          ba_can_schedule: baCanSchedule, ba_edit_event_name: baEditEventName, ba_change_venue: baChangeVenue,
          ba_reschedule: baReschedule, ba_check_in_out: baCheckInOut, photo_check_in: photoCheckIn, photo_check_out: photoCheckOut,
          show_check_photos_in_report: showCheckPhotosInReport, set_time_duration_presets: setTimeDurationPresets,
          allow_ba_to_schedule: allowBaToSchedule, override_wage: overrideWage, exclude_expenses_from_report: excludeExpensesFromReport,
          hide_ba_contact_info: hideBaContactInfo, teams, products
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      navigate('/campaigns'); // Navigate back to campaigns page
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="container">
      <h1>Create Campaign</h1>
      <form>
        <TextField
          label="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Owners"
          value={owners}
          onChange={(e) => setOwners(e.target.value)}
          fullWidth
          margin="normal"
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
        <TextField
          label="Report Template"
          value={reportTemplate}
          onChange={(e) => setReportTemplate(e.target.value)}
          fullWidth
          margin="normal"
          required
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
        <FormControlLabel
          control={<Switch checked={firstBaInventory} onChange={() => setFirstBaInventory(!firstBaInventory)} />}
          label="First BA Inventory"
        />
        <FormControlLabel
          control={<Switch checked={firstBaPostEvent} onChange={() => setFirstBaPostEvent(!firstBaPostEvent)} />}
          label="First BA Post Event"
        />
        <FormControlLabel
          control={<Switch checked={subsequentBaInventory} onChange={() => setSubsequentBaInventory(!subsequentBaInventory)} />}
          label="Subsequent BA Inventory"
        />
        <FormControlLabel
          control={<Switch checked={subsequentBaPostEvent} onChange={() => setSubsequentBaPostEvent(!subsequentBaPostEvent)} />}
          label="Subsequent BA Post Event"
        />
        <FormControlLabel
          control={<Switch checked={baCanSchedule} onChange={() => setBaCanSchedule(!baCanSchedule)} />}
          label="BA Can Schedule"
        />
        <FormControlLabel
          control={<Switch checked={baEditEventName} onChange={() => setBaEditEventName(!baEditEventName)} />}
          label="BA Edit Event Name"
        />
        <FormControlLabel
          control={<Switch checked={baChangeVenue} onChange={() => setBaChangeVenue(!baChangeVenue)} />}
          label="BA Change Venue"
        />
        <FormControlLabel
          control={<Switch checked={baReschedule} onChange={() => setBaReschedule(!baReschedule)} />}
          label="BA Reschedule"
        />
        <FormControlLabel
          control={<Switch checked={baCheckInOut} onChange={() => setBaCheckInOut(!baCheckInOut)} />}
          label="BA Check In/Out"
        />
        <FormControlLabel
          control={<Switch checked={showCheckPhotosInReport} onChange={() => setShowCheckPhotosInReport(!showCheckPhotosInReport)} />}
          label="Show Check In/Out Photos in PDF Reports"
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
          control={<Switch checked={timeDurationPresets} onChange={() => setTimeDurationPresets(!timeDurationPresets)} />}
          label="Set Time/Duration Presets for Quick Selection"
        />
        <FormControlLabel
          control={<Switch checked={allowBaToSchedule} onChange={() => setAllowBaToSchedule(!allowBaToSchedule)} />}
          label="Allow Ambassadors to Schedule Events"
        />
        <FormControlLabel
          control={<Switch checked={overrideWage} onChange={() => setOverrideWage(!overrideWage)} />}
          label="Override Wage Set in BA Profile"
        />
        <FormControlLabel
          control={<Switch checked={excludeExpensesFromReport} onChange={() => setExcludeExpensesFromReport(!excludeExpensesFromReport)} />}
          label="Exclude Expenses From PDF Report"
        />
        <FormControlLabel
          control={<Switch checked={hideBaContactInfo} onChange={() => setHideBaContactInfo(!hideBaContactInfo)} />}
          label="Hide BA Contact Information from Event Report"
        />
        <Autocomplete
          multiple
          options={availableProducts}
          value={products}
          onChange={(_e, value) => setProducts(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Products"
              fullWidth
              margin="normal"
            />
          )}
        />
        <Button variant="contained" color="primary" onClick={handleSave} style={{ marginTop: '20px' }}>
          Create Campaign
        </Button>
      </form>
    </div>
  );
};

export default CreateCampaignPage;
