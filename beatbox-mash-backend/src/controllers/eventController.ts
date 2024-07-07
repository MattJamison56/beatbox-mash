import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

// Function to create an event
export const createEvent = async (req: Request, res: Response) => {
  const {
    campaign,
    venue,
    team,
    eventName,
    preEventInstructions,
    whoSchedules,
    startDateTime,
    durationHours,
    durationMinutes,
    brandAmbassadors
  } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Fetch the campaign ID
    const requestCampaign = new sql.Request(transaction);
    const resultCampaign = await requestCampaign
      .input('campaign_name', sql.VarChar, campaign)
      .query('SELECT id FROM Campaigns WHERE name = @campaign_name');
    const campaignId = resultCampaign.recordset[0]?.id;

    if (!campaignId) {
      throw new Error(`Campaign not found: ${campaign}`);
    }

    // Fetch the venue ID
    const requestVenue = new sql.Request(transaction);
    const resultVenue = await requestVenue
      .input('venue_name', sql.VarChar, venue)
      .query('SELECT id FROM Venues WHERE name = @venue_name');
    const venueId = resultVenue.recordset[0]?.id;

    if (!venueId) {
      throw new Error(`Venue not found: ${venue}`);
    }

    // Fetch the team ID
    const requestTeam = new sql.Request(transaction);
    const resultTeam = await requestTeam
      .input('team_name', sql.VarChar, team)
      .query('SELECT id FROM Teams WHERE name = @team_name');
    const teamId = resultTeam.recordset[0]?.id;

    if (!teamId) {
      throw new Error(`Team not found: ${team}`);
    }

    // Insert the event
    const requestEvent = new sql.Request(transaction);
    const resultEvent = await requestEvent
      .input('campaign_id', sql.Int, campaignId)
      .input('venue_id', sql.Int, venueId)
      .input('team_id', sql.Int, teamId)
      .input('event_name', sql.VarChar, eventName)
      .input('pre_event_instructions', sql.Text, preEventInstructions)
      .input('who_schedules', sql.VarChar, whoSchedules)
      .input('start_date_time', sql.DateTime, startDateTime)
      .input('duration_hours', sql.Int, durationHours)
      .input('duration_minutes', sql.Int, durationMinutes)
      .query(`
        INSERT INTO Events (campaign_id, venue_id, team_id, event_name, pre_event_instructions, who_schedules, start_date_time, duration_hours, duration_minutes, created_at, updated_at)
        OUTPUT INSERTED.event_id
        VALUES (@campaign_id, @venue_id, @team_id, @event_name, @pre_event_instructions, @who_schedules, @start_date_time, @duration_hours, @duration_minutes, GETDATE(), GETDATE())
      `);

    const eventId = resultEvent.recordset[0].event_id;

    // Insert brand ambassadors for the event
    for (const ba of brandAmbassadors) {
      const requestBA = new sql.Request(transaction);
      await requestBA
        .input('event_id', sql.Int, eventId)
        .input('ba_id', sql.Int, ba.id)
        .input('inventory', sql.Bit, ba.inventory)
        .input('qa', sql.Bit, ba.qa)
        .input('photos', sql.Bit, ba.photos)
        .input('expenses', sql.Bit, ba.expenses)
        .query(`
          INSERT INTO EventBrandAmbassadors (event_id, ba_id, inventory, qa, photos, expenses)
          VALUES (@event_id, @ba_id, @inventory, @qa, @photos, @expenses)
        `);
    }

    await transaction.commit();
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};
