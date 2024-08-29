import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;

const createPayrollExcel = async (activeTab: string) => {
    const pool = await poolPromise;
    
    const payrollGroup = activeTab;

    // Query to get the relevant data
    const result = await pool.request()
    .input('payrollGroup', sql.NVarChar(255), payrollGroup)
    .query(`
        SELECT 
            U.name AS ambassadorName,
            C.name AS campaignName,
            'Regional' AS region, -- Hardcoded for now
            CONVERT(varchar, E.start_date_time, 101) AS eventDate, -- Convert datetime to mm/dd/yyyy format
            E.event_name AS eventName,
            ISNULL(SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.Amount, 0)), 0) AS totalReimbursable,  -- Sum of all reimbursable amounts for this event and BA
            0 AS totalAdditionDeduction,  -- Hardcoded as 0 for now
            ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalEventFee,  -- Sum of event fees for the BA
            ISNULL(SUM(ISNULL(R.total_amount, 0) + ISNULL(MR.TotalFee, 0) + ISNULL(OE.Amount, 0)), 0) + 
            ISNULL(SUM(U.wage * (E.duration_hours + E.duration_minutes / 60.0)), 0) AS totalPayroll  -- Total Payroll calculation
        FROM Events E
        INNER JOIN EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
        INNER JOIN Users U ON EBA.ba_id = U.id
        INNER JOIN Campaigns C ON E.campaign_id = C.id
        LEFT JOIN Receipts R ON E.event_id = R.event_id AND R.ba_id = U.id  -- Joining Receipts table
        LEFT JOIN MileageReports MR ON E.event_id = MR.EventId AND MR.ba_id = U.id  -- Joining MileageReports table
        LEFT JOIN OtherExpenses OE ON E.event_id = OE.EventId AND OE.ba_id = U.id  -- Joining OtherExpenses table
        WHERE E.payroll_group = @payrollGroup 
          AND E.is_deleted = 0 
          AND U.is_deleted = 0
        GROUP BY U.name, C.name, E.start_date_time, E.event_name
        ORDER BY U.name, E.start_date_time
    `);

    const payrollData = result.recordset;

    const workbook = xlsx.utils.book_new();
    
    // Column headers
    const headers = [
        'Ambassador Name', 
        'Campaign Name', 
        'National/Regional', 
        'Event Date', 
        'Event Name', 
        'Total Reimbursable', 
        'Total Addition/Deduction', 
        'Total Event Fee', 
        'Total Payroll'
    ];

    // Add the headers to the worksheet
    const wsData = [headers];

    // Add the payroll data to the worksheet
    payrollData.forEach(row => {
        wsData.push([
            row.ambassadorName,
            row.campaignName,
            row.region,
            row.eventDate,
            row.eventName,
            formatCurrency(row.totalReimbursable),
            formatCurrency(row.totalAdditionDeduction),
            formatCurrency(row.totalEventFee),
            formatCurrency(row.totalPayroll)
        ]);
    });

    // Add the worksheet to the workbook
    const worksheet = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(workbook, worksheet, payrollGroup);

    // Generate file path
    const filePath = path.join(__dirname, `${payrollGroup}_Payroll.xlsx`);

    // Write the workbook to a file
    xlsx.writeFile(workbook, filePath);

    return filePath;
};

export const exportPayrollToExcel = async (req: Request, res: Response) => {
    const { activeTab } = req.params;

    try {
        // Generate the Excel file
        const filePath = await createPayrollExcel(activeTab);

        // Send the file as a response
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error exporting payroll data');
            } else {
                // Optionally, delete the file after sending it
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error exporting payroll to Excel:', error);
        res.status(500).send('Error exporting payroll to Excel');
    }
};