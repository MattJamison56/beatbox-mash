import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        E.updated_at AS payrollDate,
        E.payroll_group AS payrollName,
        'Payment for event' AS comment,
        COUNT(E.event_id) AS totalEvents,
        ISNULL(SUM(R.total_amount), 0) + ISNULL(SUM(MR.TotalFee), 0) + ISNULL(SUM(OE.Amount), 0) AS totalReimbursable,
        0 AS totalNonReimbursable,
        0 AS totalOtherPaidTime,
        0 AS totalAddDeduct,
        ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalDemoFee,
        ISNULL(SUM(R.total_amount), 0) + 
        ISNULL(SUM(MR.TotalFee), 0) + 
        ISNULL(SUM(OE.Amount), 0) + 
        ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalDue
      FROM Events E
      INNER JOIN EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN Users U ON EBA.ba_id = U.id
      INNER JOIN Campaigns C ON E.campaign_id = C.id
      LEFT JOIN Receipts R ON E.event_id = R.event_id AND R.ba_id = U.id
      LEFT JOIN MileageReports MR ON E.event_id = MR.EventId AND MR.ba_id = U.id
      LEFT JOIN OtherExpenses OE ON E.event_id = OE.EventId AND OE.ba_id = U.id
      WHERE E.paid = 1
        AND E.is_deleted = 0 
        AND U.is_deleted = 0
      GROUP BY E.updated_at, E.payroll_group
      ORDER BY E.updated_at DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history.' });
  }
};

export const markAllAsPaid = async (req: Request, res: Response) => {
    const { payrollGroup } = req.params;
      
    console.log(payrollGroup);

    try {
      const pool = await poolPromise;
  
      // Update the 'paid' column to 1 for all events in the specified payroll group
      await pool.request()
        .input('payrollGroup', sql.NVarChar(255), payrollGroup)
        .query(`
          UPDATE Events
          SET paid = 1
          WHERE payroll_group = @payrollGroup
            AND is_deleted = 0
            AND (paid = 0 OR paid IS NULL) -- Only update events that haven't already been marked as paid
        `);
  
      res.status(200).json({ message: 'All events in the payroll group marked as paid successfully.' });
    } catch (error) {
      console.error('Error marking all events as paid:', error);
      res.status(500).json({ message: 'Error marking all events as paid.' });
    }
  };

  export const getPaymentDetailsById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          E.updated_at AS payrollDate,
          E.payroll_group AS payrollName,
          'Payment for event' AS comment,
          COUNT(E.event_id) AS totalEvents,
          ISNULL(SUM(R.total_amount), 0) + ISNULL(SUM(MR.TotalFee), 0) + ISNULL(SUM(OE.Amount), 0) AS totalReimbursable,
          0 AS totalNonReimbursable,
          0 AS totalOtherPaidTime,
          0 AS totalAddDeduct,
          ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalDemoFee,
          ISNULL(SUM(R.total_amount), 0) + 
          ISNULL(SUM(MR.TotalFee), 0) + 
          ISNULL(SUM(OE.Amount), 0) + 
          ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalDue
        FROM Events E
        INNER JOIN EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
        INNER JOIN Users U ON EBA.ba_id = U.id
        LEFT JOIN Receipts R ON E.event_id = R.event_id AND R.ba_id = U.id
        LEFT JOIN MileageReports MR ON E.event_id = MR.EventId AND MR.ba_id = U.id
        LEFT JOIN OtherExpenses OE ON E.event_id = OE.EventId AND OE.ba_id = U.id
        WHERE EBA.event_ba_id = @id
        GROUP BY E.updated_at, E.payroll_group
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Payment details not found' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Error fetching payment details.' });
  }
};