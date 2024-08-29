import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

// Controller for fetching event stages data
export const getEventStages = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    
    // Query to fetch the event stages data
    const result = await pool.request().query(`
      SELECT
        COUNT(CASE WHEN report_submitted = 0 THEN 1 END) AS PendingResponse,
        COUNT(CASE WHEN report_submitted = 1 AND report_approved = 0 THEN 1 END) AS PendingApproval,
        COUNT(CASE WHEN report_submitted = 1 AND report_approved = 1 AND paid = 0 THEN 1 END) AS PaymentDue,
        COUNT(CASE WHEN paid = 1 THEN 1 END) AS PaymentSent,
        COUNT(CASE WHEN report_submitted = 1 AND report_approved = 1 AND paid = 0 THEN 1 END) AS ReportDue,
        COUNT(CASE WHEN event_type IS NOT NULL THEN 1 END) AS Scheduled,
        COUNT(CASE WHEN is_deleted = 1 THEN 1 END) AS Declined
      FROM dbo.Events
    `);
    
    // Sending the response with the event stages data
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching event stages:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
