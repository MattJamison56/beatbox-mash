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

export const approveEvent = async (req: Request, res: Response) => {
  const { id, message, payrollGroup } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('event_id', id)
      .input('payroll_group', payrollGroup || 'Approved Events')
      .query(`
        UPDATE Events
        SET report_approved = 1, report_submitted = NULL, payroll_group = @payroll_group, updated_at = GETDATE()
        WHERE event_id = @event_id
      `);

    // Get the email of the Brand Ambassador associated with the event
    const result = await pool.request()
      .input('event_id', id)
      .query(`
        SELECT U.email
        FROM EventBrandAmbassadors EBA
        JOIN Users U ON EBA.ba_id = U.id
        WHERE EBA.event_id = @event_id
      `);

    const email = result.recordset[0]?.email;

    if (!email) {
      return res.status(400).json({ message: 'No Brand Ambassador found for this event' });
    }

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

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Event Approved',
      text: `Your event has been approved.\n\nMessage: ${message || 'No additional message.'}`,
    };

    transporter.sendMail(mailOptions, (err: any) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'Event approved, payroll group set, and email sent successfully' });
    });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ message: 'Error approving event' });
  }
};

export const rejectEvent = async (req: Request, res: Response) => {
  const { id, message } = req.body;

  try {
    const pool = await poolPromise;

    // Update the event as rejected in the database
    await pool.request()
      .input('event_id', id)
      .query(`
        UPDATE Events
        SET report_approved = 0, report_submitted = NULL, updated_at = GETDATE()
        WHERE event_id = @event_id
      `);

    // Get the email of the Brand Ambassador associated with the event
    const result = await pool.request()
      .input('event_id', id)
      .query(`
        SELECT U.email
        FROM EventBrandAmbassadors EBA
        JOIN Users U ON EBA.ba_id = U.id
        WHERE EBA.event_id = @event_id
      `);

    const email = result.recordset[0]?.email;

    if (!email) {
      return res.status(400).json({ message: 'No Brand Ambassador found for this event' });
    }

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

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Event Rejected',
      text: `Your event has been rejected.\n\nMessage: ${message || 'No additional message.'}`,
    };

    transporter.sendMail(mailOptions, (err: any) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'Event rejected and email sent successfully' });
    });
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ message: 'Error rejecting event' });
  }
};

export const getApprovedEvents = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    // SQL Query to fetch approved events, grouped by BA
    const result = await pool.request().query(`
      SELECT 
        U.id AS baId,
        U.name AS baName,
        U.avatar_url AS baAvatarUrl,  -- Avatar URL
        COUNT(DISTINCT E.event_id) AS eventCount,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0)) AS reimb,
        SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS eventFee,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0) + U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS totalDue,
        E.start_date_time AS startDateTime,
        DATEADD(MINUTE, E.duration_minutes, DATEADD(HOUR, E.duration_hours, E.start_date_time)) AS endDateTime,
        E.duration_hours AS durationHours,
        E.duration_minutes AS durationMinutes,
        V.name AS venueName,  -- Venue name
        E.event_name AS eventName  -- Event name
      FROM 
        Events E
      INNER JOIN 
        EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN 
        Users U ON EBA.ba_id = U.id
      LEFT JOIN 
        Venues V ON E.venue_id = V.id  -- Correct JOIN for Venues table
      LEFT JOIN 
        Receipts R ON E.event_id = R.event_id
      LEFT JOIN 
        MileageReports MR ON E.event_id = MR.EventId
      LEFT JOIN 
        OtherExpenses OE ON E.event_id = OE.EventId
      WHERE 
        E.report_approved = 1 AND E.report_submitted IS NULL
      GROUP BY 
        U.id, U.name, U.avatar_url, E.start_date_time, E.duration_hours, E.duration_minutes, V.name, E.event_name
      ORDER BY 
        U.name ASC;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching approved events:', error.message);
      res.status(500).json({ message: 'Error fetching approved events', error: error.message });
    } else {
      console.error('Unknown error fetching approved events:', error);
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

export const getEventsWithReimbursements = async (req: Request, res: Response) => {
  const { ba_id } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ba_id', sql.Int, ba_id)
      .query(`
        SELECT 
          E.event_id AS id,
          E.event_name AS eventName,
          E.start_date_time AS startDateTime,
          DATEADD(MINUTE, E.duration_minutes, DATEADD(HOUR, E.duration_hours, E.start_date_time)) AS endDateTime,
          T.name AS team,
          V.name AS venue,
          C.name AS campaign,
          EBA.inventory,
          EBA.qa,
          EBA.photos,
          EBA.expenses,
          ISNULL(SUM(MR.TotalFee), 0) + ISNULL(SUM(R.total_amount), 0) + ISNULL(SUM(OE.Amount), 0) AS reimbursedAmount, -- Calculate the reimbursed amount
          U.wage AS hourlyRate,
          -- Calculate the event fee based on duration and hourly rate
          (E.duration_hours + E.duration_minutes / 60.0) * U.wage AS eventFee,
          -- Calculate the total due amount
          ISNULL(SUM(MR.TotalFee), 0) + ISNULL(SUM(R.total_amount), 0) + ISNULL(SUM(OE.Amount), 0) + 
          ((E.duration_hours + E.duration_minutes / 60.0) * U.wage) AS totalDue
        FROM 
          Events E
        JOIN 
          EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
        JOIN 
          Teams T ON E.team_id = T.id
        JOIN 
          Venues V ON E.venue_id = V.id
        JOIN 
          Campaigns C ON E.campaign_id = C.id
        JOIN
          Users U ON EBA.ba_id = U.id -- Assuming wage is in the Users table
        LEFT JOIN 
          MileageReports MR ON E.event_id = MR.EventId
        LEFT JOIN 
          Receipts R ON E.event_id = R.event_id
        LEFT JOIN 
          OtherExpenses OE ON E.event_id = OE.EventId
        WHERE 
          EBA.ba_id = @ba_id AND E.report_approved = 1
        GROUP BY 
          E.event_id, E.event_name, E.start_date_time, E.duration_minutes, E.duration_hours, 
          T.name, V.name, C.name, EBA.inventory, EBA.qa, EBA.photos, EBA.expenses, U.wage
        ORDER BY 
          E.start_date_time DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching events with reimbursements:', error);
    res.status(500).json({ message: 'Error fetching events with reimbursements' });
  }
};

export const getEventsByPayrollGroups = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        U.id AS baId,
        U.name AS baName,
        U.avatar_url AS baAvatarUrl,
        E.payroll_group AS payrollGroup,
        COUNT(E.event_id) AS eventCount,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0)) AS reimb,
        SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS eventFee,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0) + U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS totalDue,
        STRING_AGG(E.event_id, ',') AS eventIds -- Collect all event IDs for this BA
      FROM 
        Events E
      INNER JOIN 
        EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN 
        Users U ON EBA.ba_id = U.id
      LEFT JOIN 
        Receipts R ON E.event_id = R.event_id
      LEFT JOIN 
        MileageReports MR ON E.event_id = MR.EventId
      LEFT JOIN 
        OtherExpenses OE ON E.event_id = OE.EventId
      WHERE 
        E.report_approved = 1
      GROUP BY 
        U.id, U.name, U.avatar_url, E.payroll_group
      ORDER BY 
        E.payroll_group ASC, U.name ASC;
    `);

    const events = result.recordset;

    // Group events by payrollGroup and add events array
    const groupedEvents = events.reduce((acc: any, event: any) => {
      if (!acc[event.payrollGroup]) {
        acc[event.payrollGroup] = [];
      }

      // Add event IDs as an array
      const baWithEvents = {
        ...event,
        events: event.eventIds.split(',').map((id: string) => ({ id: parseInt(id) })) // convert eventIds into an array of event objects
      };

      acc[event.payrollGroup].push(baWithEvents);
      return acc;
    }, {});

    res.status(200).json(groupedEvents);
  } catch (error) {
    console.error('Error fetching events by payroll groups:', error);
    res.status(500).json({ message: 'Error fetching events by payroll groups' });
  }
};

export const updatePayrollGroup = async (req: Request, res: Response) => {
  const { eventIds, payrollGroup } = req.body;

  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    console.error('Invalid event IDs provided');
    return res.status(400).json({ message: 'Invalid event IDs provided' });
  }

  try {
    const pool = await poolPromise;

    // Log the SQL query that will be executed
    const query = `
      UPDATE Events
      SET payroll_group = @payrollGroup, updated_at = GETDATE()
      WHERE event_id IN (${eventIds.map(id => `'${id}'`).join(", ")})
    `;
    console.log("Executing query:", query);

    await pool.request()
      .input('payrollGroup', sql.NVarChar, payrollGroup)
      .query(query);

    console.log('Payroll group updated successfully');
    res.status(200).json({ message: 'Payroll group updated successfully' });
  } catch (error) {
    console.error('Error updating payroll group:', error);
    res.status(500).json({ message: 'Error updating payroll group' });
  }
};