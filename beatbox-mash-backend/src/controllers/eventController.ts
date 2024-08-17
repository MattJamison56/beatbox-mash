import { Request, Response } from 'express';
import { poolPromise } from '../database';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

export const notifyAmbassadors = async (req: Request, res: Response) => {
  const { brandAmbassadors, eventName, startDateTime, venue, preEventInstructions } = req.body;

  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token as string,
      },
    });

    for (const ba of brandAmbassadors) {
      const mailOptions = {
        to: ba.email,
        from: process.env.EMAIL_USER,
        subject: 'New Event Assignment',
        text: `You have been assigned a new event:\n\n
          Event Name: ${eventName}\n
          Date and Time: ${startDateTime}\n
          Venue: ${venue}\n
          Instructions: ${preEventInstructions}\n\n
          Please log in to your dashboard to view more details.`,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Error sending notifications', error: (error as Error).message });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        e.event_id AS id,
        t.name AS team,
        e.event_type AS eventType, -- Fetch eventType directly from Events table
        e.event_name AS eventName,
        e.start_date_time AS startDateTime,
        DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) AS endDateTime,
        e.duration_hours,
        e.duration_minutes,
        CASE 
          WHEN DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) < GETDATE() THEN 'Completed'
          ELSE 'Active'
        END AS status, -- Calculate status based on end date
        v.name AS venue,
        c.name AS campaign,
        STUFF((
          SELECT ', ' + ba.name
          FROM Users ba
          JOIN EventBrandAmbassadors eba ON ba.id = eba.ba_id
          WHERE eba.event_id = e.event_id
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS staffing -- Concatenate BA names
      FROM Events e
      JOIN Teams t ON e.team_id = t.id
      JOIN Venues v ON e.venue_id = v.id
      JOIN Campaigns c ON e.campaign_id = c.id
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Function to create an event
export const createEvent = async (req: Request, res: Response) => {
  const {
    campaign,
    venue,
    team,
    eventType,
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
      .input('event_type', sql.VarChar, eventType)
      .input('event_name', sql.VarChar, eventName)
      .input('pre_event_instructions', sql.Text, preEventInstructions)
      .input('who_schedules', sql.VarChar, whoSchedules)
      .input('start_date_time', sql.DateTime, startDateTime)
      .input('duration_hours', sql.Int, durationHours)
      .input('duration_minutes', sql.Int, durationMinutes)
      .query(`
        INSERT INTO Events (campaign_id, venue_id, team_id, event_type, event_name, pre_event_instructions, who_schedules, start_date_time, duration_hours, duration_minutes, created_at, updated_at)
        OUTPUT INSERTED.event_id
        VALUES (@campaign_id, @venue_id, @team_id, @event_type, @event_name, @pre_event_instructions, @who_schedules, @start_date_time, @duration_hours, @duration_minutes, GETDATE(), GETDATE())
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


export const deleteEvent = async (req: Request, res: Response) => {
  const { eventId } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Delete brand ambassadors associated with the event
    const requestBA = new sql.Request(transaction);
    await requestBA
      .input('event_id', sql.Int, eventId)
      .query('DELETE FROM EventBrandAmbassadors WHERE event_id = @event_id');

    // Delete the event
    const requestEvent = new sql.Request(transaction);
    await requestEvent
      .input('event_id', sql.Int, eventId)
      .query('DELETE FROM Events WHERE event_id = @event_id');

    await transaction.commit();
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const getMyEvents = async (req: Request, res: Response) => {
  const { ba_id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ba_id', sql.Int, ba_id)
      .query(`
        SELECT 
          e.event_id AS id,
          e.event_name AS eventName,
          e.start_date_time AS startDateTime,
          DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) AS endDateTime,
          t.name AS team,
          v.name AS venue,
          c.name AS campaign,
          e.report_submitted AS report_submitted,  -- Add this line
          eba.inventory,
          eba.qa,
          eba.photos,
          eba.expenses
        FROM 
          Events e
        JOIN 
          EventBrandAmbassadors eba ON e.event_id = eba.event_id
        JOIN 
          Teams t ON e.team_id = t.id
        JOIN 
          Venues v ON e.venue_id = v.id
        JOIN 
          Campaigns c ON e.campaign_id = c.id
        WHERE 
          eba.ba_id = @ba_id
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

export const getPendingEventsForApproval = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        WITH BA_Wages AS (
          SELECT 
            e.event_id,
            SUM(u.wage * (e.duration_hours + e.duration_minutes / 60.0)) AS totalWages
          FROM 
            Events e
          JOIN 
            EventBrandAmbassadors eba ON e.event_id = eba.event_id
          JOIN 
            Users u ON eba.ba_id = u.id
          GROUP BY 
            e.event_id
        )
        SELECT 
          e.event_id AS id,
          e.event_name AS eventName,
          c.name AS campaigns,
          v.region AS region,
          t.name AS team,
          u.name AS baName,
          u.avatar_url AS baAvatarUrl,
          e.start_date_time AS startDate,
          e.updated_at AS reportDate, 
          (
            ISNULL(
              (
                SELECT SUM(r.total_amount)
                FROM Receipts r
                WHERE r.event_id = e.event_id
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(mr.TotalFee)
                FROM MileageReports mr
                WHERE mr.EventId = e.event_id
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(oe.Amount)
                FROM OtherExpenses oe
                WHERE oe.EventId = e.event_id
              ), 0
            )
          ) AS totalExpense,
          (
            SELECT COUNT(r.receipt_id)
            FROM Receipts r
            WHERE r.event_id = e.event_id
          ) AS expensesCount,
          COUNT(ep.photo_id) AS photosCount,
          (
            baw.totalWages + 
            ISNULL(
              (
                SELECT SUM(r.total_amount)
                FROM Receipts r
                WHERE r.event_id = e.event_id
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(mr.TotalFee)
                FROM MileageReports mr
                WHERE mr.EventId = e.event_id
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(oe.Amount)
                FROM OtherExpenses oe
                WHERE oe.EventId = e.event_id
              ), 0
            )
          ) AS totalDue
        FROM 
          Events e
        JOIN 
          EventBrandAmbassadors eba ON e.event_id = eba.event_id
        JOIN 
          Users u ON eba.ba_id = u.id
        JOIN 
          Teams t ON e.team_id = t.id
        JOIN 
          Venues v ON e.venue_id = v.id
        JOIN 
          Campaigns c ON e.campaign_id = c.id
        LEFT JOIN 
          EventPhotos ep ON e.event_id = ep.event_id
        LEFT JOIN 
          BA_Wages baw ON e.event_id = baw.event_id
        WHERE 
          e.report_submitted = 1
          AND (eba.inventory = 1 OR eba.qa = 1)  -- Main BA filtering logic
        GROUP BY 
          e.event_id, e.event_name, c.name, v.region, t.name, u.name, u.avatar_url, e.start_date_time, e.updated_at, baw.totalWages
        ORDER BY 
          e.updated_at DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ message: 'Error fetching pending events' });
  }
};