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
        e.event_type AS eventType,
        e.event_name AS eventName,
        e.start_date_time AS startDateTime,
        DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) AS endDateTime,
        e.duration_hours,
        e.duration_minutes,
        CASE 
          WHEN DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) < GETDATE() THEN 'Completed'
          ELSE 'Active'
        END AS status,
        v.name AS venue,
        c.name AS campaign,
        STUFF((
          SELECT ', ' + ba.name
          FROM Users ba
          JOIN EventBrandAmbassadors eba_sub ON ba.id = eba_sub.ba_id
          WHERE eba_sub.event_id = e.event_id
            AND ba.is_deleted = 0 -- Only include active Brand Ambassadors
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS staffing,
        -- New counts based on ambassador statuses
        SUM(CASE WHEN eba.status = 'accepted' THEN 1 ELSE 0 END) AS acceptedAmbassadorsCount,
        SUM(CASE WHEN eba.status = 'pending' THEN 1 ELSE 0 END) AS pendingAmbassadorsCount,
        SUM(CASE WHEN eba.status = 'declined' THEN 1 ELSE 0 END) AS declinedAmbassadorsCount
      FROM Events e
      JOIN Teams t ON e.team_id = t.id AND t.is_deleted = 0 -- Only include active Teams
      JOIN Venues v ON e.venue_id = v.id AND v.is_deleted = 0 -- Only include active Venues
      JOIN Campaigns c ON e.campaign_id = c.id AND c.is_deleted = 0 -- Only include active Campaigns
      LEFT JOIN EventBrandAmbassadors eba ON e.event_id = eba.event_id
      WHERE e.is_deleted = 0 -- Only include active Events
      GROUP BY 
        e.event_id,
        t.name,
        e.event_type,
        e.event_name,
        e.start_date_time,
        e.duration_minutes,
        e.duration_hours,
        v.name,
        c.name
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
        .input('mileage_allowed', sql.Bit, ba.mileageExpense)
        .query(`
          INSERT INTO EventBrandAmbassadors (event_id, ba_id, inventory, qa, photos, expenses, mileage_allowed)
          VALUES (@event_id, @ba_id, @inventory, @qa, @photos, @expenses, @mileage_allowed)
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

    // Delete the event
    const requestEvent = new sql.Request(transaction);
    await requestEvent
      .input('event_id', sql.Int, eventId)
      .query('UPDATE Events SET is_deleted = 1 WHERE event_id = @event_id');

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
          e.report_submitted AS report_submitted,
          eba.inventory,
          eba.qa,
          eba.photos,
          eba.expenses,
          eba.personal_report_submitted,
          eba.status AS ambassadorStatus -- Renamed here
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
          AND e.is_deleted = 0
          AND t.is_deleted = 0
          AND v.is_deleted = 0
          AND c.is_deleted = 0
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
          WHERE 
            e.is_deleted = 0 AND u.is_deleted = 0  -- Filter for active records
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
                WHERE r.event_id = e.event_id  -- Only include receipts
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(mr.TotalFee)
                FROM MileageReports mr
                WHERE mr.EventId = e.event_id  -- Only include mileage reports
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(oe.Amount)
                FROM OtherExpenses oe
                WHERE oe.EventId = e.event_id  -- Only include other expenses
              ), 0
            )
          ) AS totalExpense,
          (
            SELECT COUNT(r.receipt_id)
            FROM Receipts r
            WHERE r.event_id = e.event_id  -- Only include receipts
          ) AS expensesCount,
          COUNT(ep.photo_id) AS photosCount,
          (
            baw.totalWages + 
            ISNULL(
              (
                SELECT SUM(r.total_amount)
                FROM Receipts r
                WHERE r.event_id = e.event_id  -- Only include receipts
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(mr.TotalFee)
                FROM MileageReports mr
                WHERE mr.EventId = e.event_id  -- Only include mileage reports
              ), 0
            ) + 
            ISNULL(
              (
                SELECT SUM(oe.Amount)
                FROM OtherExpenses oe
                WHERE oe.EventId = e.event_id  -- Only include other expenses
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
          AND e.is_deleted = 0  -- Only include active events
          AND u.is_deleted = 0  -- Only include active users
          AND t.is_deleted = 0  -- Only include active teams
          AND v.is_deleted = 0  -- Only include active venues
          AND c.is_deleted = 0  -- Only include active campaigns
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

    // Approve the event and update the payroll group
    await pool.request()
      .input('event_id', id)
      .input('payroll_group', payrollGroup || 'Approved Events')
      .query(`
        UPDATE Events
        SET report_approved = 1, report_submitted = NULL, payroll_group = @payroll_group, updated_at = GETDATE()
        WHERE event_id = @event_id
      `);

    // Retrieve all email addresses of Brand Ambassadors associated with the event
    const result = await pool.request()
      .input('event_id', id)
      .query(`
        SELECT U.email
        FROM EventBrandAmbassadors EBA
        JOIN Users U ON EBA.ba_id = U.id
        WHERE EBA.event_id = @event_id
      `);

    const emails = result.recordset.map(row => row.email);

    if (emails.length === 0) {
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

    // Send an email to each Brand Ambassador
    const emailPromises = emails.map(email => {
      const mailOptions = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Event Approved',
        text: `Your event has been approved.\n\nMessage: ${message || 'No additional message.'}`,
      };

      return transporter.sendMail(mailOptions);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    res.status(200).json({ message: 'Event approved, payroll group set, and emails sent successfully' });
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
        WHERE event_id = @event_id AND is_deleted = 0
      `);

    // Get the email of the Brand Ambassador associated with the event
    const result = await pool.request()
      .input('event_id', id)
      .query(`
        SELECT U.email
        FROM EventBrandAmbassadors EBA
        JOIN Users U ON EBA.ba_id = U.id
        WHERE EBA.event_id = @event_id AND EBA.is_deleted = 0 AND U.is_deleted = 0
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

    const result = await pool.request().query(`
      SELECT 
        U.id AS baId,
        U.name AS baName,
        U.avatar_url AS baAvatarUrl,
        COUNT(DISTINCT E.event_id) AS eventCount,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0)) AS reimb,
        SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS eventFee,
        SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.amount, 0) + U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS totalDue,
        E.start_date_time AS startDateTime,
        DATEADD(MINUTE, E.duration_minutes, DATEADD(HOUR, E.duration_hours, E.start_date_time)) AS endDateTime,
        E.duration_hours AS durationHours,
        E.duration_minutes AS durationMinutes,
        V.name AS venueName,
        E.event_name AS eventName
      FROM 
        Events E
      INNER JOIN 
        EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN 
        Users U ON EBA.ba_id = U.id
      LEFT JOIN 
        Venues V ON E.venue_id = V.id
      LEFT JOIN 
        Receipts R ON E.event_id = R.event_id
      LEFT JOIN 
        MileageReports MR ON E.event_id = MR.EventId
      LEFT JOIN 
        OtherExpenses OE ON E.event_id = OE.EventId
      WHERE 
        E.report_approved = 1 AND E.report_submitted IS NULL
        AND E.is_deleted = 0 AND EBA.is_deleted = 0 AND U.is_deleted = 0
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
          ISNULL(SUM(MR.TotalFee), 0) + ISNULL(SUM(R.total_amount), 0) + ISNULL(SUM(OE.Amount), 0) AS reimbursedAmount,
          U.wage AS hourlyRate,
          (E.duration_hours + E.duration_minutes / 60.0) * U.wage AS eventFee,
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
          Users U ON EBA.ba_id = U.id
        LEFT JOIN 
          MileageReports MR ON E.event_id = MR.EventId AND MR.ba_id = @ba_id
        LEFT JOIN 
          Receipts R ON E.event_id = R.event_id AND R.ba_id = @ba_id
        LEFT JOIN 
          OtherExpenses OE ON E.event_id = OE.EventId AND OE.ba_id = @ba_id
        WHERE 
          EBA.ba_id = @ba_id 
          AND E.report_approved = 1  -- Only approved reports
          AND (E.paid = 0 OR E.paid IS NULL)            -- Only unpaid events
          AND E.is_deleted = 0 
          AND U.is_deleted = 0
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
        COUNT(DISTINCT E.event_id) AS eventCount,  -- Ensure counting unique events
        SUM(
          ISNULL(R.total_amount, 0) * CASE WHEN R.ba_id = U.id THEN 1 ELSE 0 END +
          ISNULL(MR.TotalFee, 0) * CASE WHEN MR.ba_id = U.id THEN 1 ELSE 0 END +
          ISNULL(OE.amount, 0) * CASE WHEN OE.ba_id = U.id THEN 1 ELSE 0 END
        ) AS reimb,
        SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)) AS eventFee,
        SUM(
          ISNULL(R.total_amount, 0) * CASE WHEN R.ba_id = U.id THEN 1 ELSE 0 END +
          ISNULL(MR.TotalFee, 0) * CASE WHEN MR.ba_id = U.id THEN 1 ELSE 0 END +
          ISNULL(OE.amount, 0) * CASE WHEN OE.ba_id = U.id THEN 1 ELSE 0 END +
          U.wage * (E.duration_hours + E.duration_minutes / 60.0)
        ) AS totalDue,
        STRING_AGG(E.event_id, ',') AS eventIds
      FROM 
        Events E
      INNER JOIN 
        EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN 
        Users U ON EBA.ba_id = U.id
      LEFT JOIN 
        Receipts R ON E.event_id = R.event_id AND R.ba_id = U.id
      LEFT JOIN 
        MileageReports MR ON E.event_id = MR.EventId AND MR.ba_id = U.id
      LEFT JOIN 
        OtherExpenses OE ON E.event_id = OE.EventId AND OE.ba_id = U.id
      WHERE 
        E.report_approved = 1
        AND E.is_deleted = 0 
        AND (E.paid = 0 OR E.paid IS NULL) -- Exclude paid events
        AND U.is_deleted = 0
      GROUP BY 
        U.id, U.name, U.avatar_url, E.payroll_group
      ORDER BY 
        E.payroll_group ASC, U.name ASC;
    `);

    const events = result.recordset;

    const groupedEvents = events.reduce((acc: any, event: any) => {
      if (!acc[event.payrollGroup]) {
        acc[event.payrollGroup] = [];
      }

      const baWithEvents = {
        ...event,
        events: event.eventIds.split(',').map((id: string) => ({ id: parseInt(id) }))
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

    const query = `
      UPDATE Events
      SET payroll_group = @payrollGroup, updated_at = GETDATE()
      WHERE event_id IN (${eventIds.map(id => `'${id}'`).join(", ")}) AND is_deleted = 0
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

export const sendDeclineEmail = async (to: string[], subject: string, text: string) => {
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const declineEvent = async (req: Request, res: Response) => {
  const { ba_id } = req.body;
  const { event_id } = req.params;

  try {
    const pool = await poolPromise;

    // Get event details
    const eventResult = await pool.request()
      .input('event_id', sql.Int, event_id)
      .query('SELECT * FROM Events WHERE event_id = @event_id');

    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventResult.recordset[0];

    // Calculate the end time
    const startTime = new Date(event.start_date_time);
    const endTime = new Date(startTime.getTime());
    endTime.setHours(endTime.getHours() + event.duration_hours);
    endTime.setMinutes(endTime.getMinutes() + event.duration_minutes);

    // Get the ambassador's assignment details
    const baAssignmentResult = await pool.request()
      .input('event_id', sql.Int, event_id)
      .input('ba_id', sql.Int, ba_id)
      .query('SELECT * FROM EventBrandAmbassadors WHERE event_id = @event_id AND ba_id = @ba_id');

    if (baAssignmentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ambassador assignment not found' });
    }

    const baAssignment = baAssignmentResult.recordset[0]; // This line ensures that `baAssignment` is declared and assigned.

    // Get the ambassador's name and email
    const ambassadorResult = await pool.request()
      .input('ba_id', sql.Int, ba_id)
      .query('SELECT name, email FROM Users WHERE id = @ba_id');

    if (ambassadorResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Ambassador not found' });
    }

    const ambassador = ambassadorResult.recordset[0];

    // Get the campaign owners' emails
    const campaignOwnersResult = await pool.request()
      .input('campaign_id', sql.Int, event.campaign_id)
      .query(`
        SELECT owner_ids
        FROM Campaigns
        WHERE id = @campaign_id
      `);

    if (campaignOwnersResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const ownerIds = campaignOwnersResult.recordset[0].owner_ids.split(',');

    // Fetch the emails of the owners
    const ownersEmailsResult = await pool.request()
      .input('ownerIds', sql.NVarChar(sql.MAX), ownerIds.join(','))
      .query(`
        SELECT email
        FROM Users
        WHERE id IN (${ownerIds.map((id: string) => `'${id.trim()}'`).join(',')})
      `);

    const ownerEmails = ownersEmailsResult.recordset.map((row: any) => row.email);

    if (ownerEmails.length === 0) {
      return res.status(404).json({ message: 'No owner emails found' });
    }

    // Prepare email content
    let emailContent = `The following event has been declined by ambassador ${ambassador.name} (${ambassador.email}):\n\nEvent: ${event.event_name}\nStart: ${startTime}\nEnd: ${endTime}`;

    // Check if the ambassador was responsible for inventory and QA
    if (baAssignment.inventory) emailContent += "\n\nNote: This ambassador was assigned inventory responsibilities.";
    if (baAssignment.qa) emailContent += "\n\nNote: This ambassador was assigned QA responsibilities.";

    // If they were the only ambassador, add a note
    const otherAmbassadorsResult = await pool.request()
      .input('event_id', sql.Int, event_id)
      .input('ba_id', sql.Int, ba_id)
      .query('SELECT COUNT(*) as count FROM EventBrandAmbassadors WHERE event_id = @event_id AND ba_id <> @ba_id');

    if (otherAmbassadorsResult.recordset[0].count === 0) {
      emailContent += "\n\nNote: This was the only ambassador assigned to this event.";
    } else {
      // Reassign inventory and QA to another ambassador
      await pool.request()
        .input('event_id', sql.Int, event_id)
        .input('ba_id', sql.Int, ba_id)
        .query(`
          WITH CTE AS (
            SELECT TOP 1 * 
            FROM EventBrandAmbassadors 
            WHERE event_id = @event_id AND ba_id <> @ba_id AND (inventory = 0 OR inventory IS NULL OR qa = 0 OR qa IS NULL)
            ORDER BY NEWID()  -- Randomly pick an ambassador if more than one is available
          )
          UPDATE CTE 
          SET inventory = ISNULL(inventory, 1), qa = ISNULL(qa, 1);
        `);
    }

     // Update the status to 'declined' instead of deleting the record
     await pool.request()
     .input('event_id', sql.Int, event_id)
     .input('ba_id', sql.Int, ba_id)
     .input('status', sql.VarChar(20), 'declined')
     .query(`
       UPDATE EventBrandAmbassadors
       SET status = @status
       WHERE event_id = @event_id AND ba_id = @ba_id
     `);

    // Send the email using the sendDeclineEmail function
    await sendDeclineEmail(ownerEmails, 'Event Declined', emailContent);

    res.status(200).json({ message: 'Event declined, assignment removed, and email sent successfully' });
  } catch (error: any) {
    console.error('Error in declineEvent:', error);
    res.status(500).json({ message: 'Error declining event', error: error.message });
  }
};

export const getBrandAmbassadorData = async (req: Request, res: Response) => {
  try {
    const { eventId, baId } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input('event_id', sql.Int, eventId)
      .input('ba_id', sql.Int, baId)
      .query(`
        SELECT 
          inventory,
          qa,
          photos,
          expenses,
          mileage_allowed
        FROM 
          EventBrandAmbassadors
        WHERE 
          event_id = @event_id AND ba_id = @ba_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Brand ambassador assignment not found for this event.' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching brand ambassador data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const acceptEvent = async (req: Request, res: Response) => {
  const { ba_id } = req.body;
  const { event_id } = req.params;

  try {
    const pool = await poolPromise;

    // Update the status to 'accepted'
    await pool.request()
      .input('event_id', sql.Int, event_id)
      .input('ba_id', sql.Int, ba_id)
      .input('status', sql.VarChar(20), 'accepted')
      .query(`
        UPDATE EventBrandAmbassadors
        SET status = @status
        WHERE event_id = @event_id AND ba_id = @ba_id
      `);

    res.status(200).json({ message: 'Event accepted successfully' });
  } catch (error: any) {
    console.error('Error in acceptEvent:', error);
    res.status(500).json({ message: 'Error accepting event', error: error.message });
  }
};

export const getEventsWithAmbassadors = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        e.event_id AS id,
        t.name AS team,
        e.event_type AS eventType,
        e.event_name AS eventName,
        e.start_date_time AS startDateTime,
        DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) AS endDateTime,
        e.duration_hours,
        e.duration_minutes,
        CASE 
          WHEN DATEADD(MINUTE, e.duration_minutes, DATEADD(HOUR, e.duration_hours, e.start_date_time)) < GETDATE() THEN 'Completed'
          ELSE 'Active'
        END AS status,
        v.name AS venue,
        c.name AS campaign,
        STUFF((
          SELECT ', ' + ba.name
          FROM Users ba
          JOIN EventBrandAmbassadors eba_sub ON ba.id = eba_sub.ba_id
          WHERE eba_sub.event_id = e.event_id
            AND ba.is_deleted = 0 -- Only include active Brand Ambassadors
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS staffing,
        
        -- New counts based on ambassador statuses
        SUM(CASE WHEN eba.status = 'accepted' THEN 1 ELSE 0 END) AS acceptedAmbassadorsCount,
        SUM(CASE WHEN eba.status = 'pending' THEN 1 ELSE 0 END) AS pendingAmbassadorsCount,
        SUM(CASE WHEN eba.status = 'declined' THEN 1 ELSE 0 END) AS declinedAmbassadorsCount,

        -- Fetch Ambassadors for each event
        (
          SELECT JSON_QUERY((
            SELECT 
              ba.id, 
              ba.name, 
              ba.avatar_url, 
              eba.status, 
              eba.personal_report_submitted
            FROM dbo.Users ba
            JOIN dbo.EventBrandAmbassadors eba ON ba.id = eba.ba_id
            WHERE eba.event_id = e.event_id
            AND ba.is_deleted = 0
            FOR JSON PATH
          )) AS ambassadors
        )

      FROM Events e
      JOIN Teams t ON e.team_id = t.id AND t.is_deleted = 0 -- Only include active Teams
      JOIN Venues v ON e.venue_id = v.id AND v.is_deleted = 0 -- Only include active Venues
      JOIN Campaigns c ON e.campaign_id = c.id AND c.is_deleted = 0 -- Only include active Campaigns
      LEFT JOIN EventBrandAmbassadors eba ON e.event_id = eba.event_id
      WHERE e.is_deleted = 0 -- Only include active Events
      GROUP BY 
        e.event_id,
        t.name,
        e.event_type,
        e.event_name,
        e.start_date_time,
        e.duration_minutes,
        e.duration_hours,
        v.name,
        c.name
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching events with ambassadors:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};
