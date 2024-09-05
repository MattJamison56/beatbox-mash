// controllers/authController.ts
import { Request, Response } from 'express';
import { poolPromise } from '../database';

export const getProductData = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        p.ProductID,
        p.ProductName,

        -- Total units sold for each product in the current month
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.sold 
            ELSE 0 END), 0) AS unitsSold,

        -- Dollar amount of units sold (units sold * MSRP) in the current month
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.sold * p.MSRP 
            ELSE 0 END), 0) AS totalDollarSales,

        -- Average sales per event (demos) in the current month
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.sold 
            ELSE 0 END) * 1.0 / NULLIF(COUNT(DISTINCT CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN e.event_id 
            ELSE NULL END), 0), 0) AS avgSalesPerDemo,

        -- Number of demos/events the product was part of in the current month
        COUNT(DISTINCT CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN e.event_id 
            ELSE NULL END) AS demosByProduct,

        -- Percentage of products not sold at demos in the current month
        CASE 
          WHEN SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.beginning_inventory 
            ELSE 0 END) = 0 THEN 0
          ELSE ROUND(100 * (1 - (SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.sold 
            ELSE 0 END) * 1.0 / SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
            THEN ei.beginning_inventory 
            ELSE 0 END))), 1)
        END AS percentNotSoldAtDemo

      FROM Products p
      LEFT JOIN EventInventory ei ON p.ProductID = ei.product_id
      LEFT JOIN Events e ON ei.event_id = e.event_id
      WHERE p.is_deleted = 0 AND e.is_deleted = 0
      GROUP BY p.ProductID, p.ProductName, p.MSRP
      ORDER BY p.ProductName;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ message: 'Error fetching product data' });
  }
};



export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        -- Total events that have report_approved as true in the current month
        (SELECT COUNT(DISTINCT e.event_id) 
         FROM Events e 
         WHERE e.report_approved = 1 
           AND e.is_deleted = 0 
           AND MONTH(e.start_date_time) = MONTH(GETDATE())
           AND YEAR(e.start_date_time) = YEAR(GETDATE())) AS totalEvents,

        -- Total venues that have been used in events in the current month
        (SELECT COUNT(DISTINCT v.id) 
         FROM Venues v
         JOIN Events e ON v.id = e.venue_id 
         WHERE v.is_deleted = 0 
           AND e.report_approved = 1
           AND e.is_deleted = 0
           AND MONTH(e.start_date_time) = MONTH(GETDATE())
           AND YEAR(e.start_date_time) = YEAR(GETDATE())) AS totalVenues,

        -- Total unique ambassadors involved with those events in the current month
        (SELECT COUNT(DISTINCT u.id)
         FROM Users u
         JOIN EventBrandAmbassadors eba ON u.id = eba.ba_id
         JOIN Events e ON e.event_id = eba.event_id
         WHERE u.is_deleted = 0 
           AND e.report_approved = 1
           AND e.is_deleted = 0
           AND MONTH(e.start_date_time) = MONTH(GETDATE())
           AND YEAR(e.start_date_time) = YEAR(GETDATE())) AS totalAmbassadors,

        -- Total revenue (only for events where report_approved = true in the current month)
        ISNULL((SELECT SUM(ei.sold * p.MSRP)
         FROM EventInventory ei 
         JOIN Products p ON ei.product_id = p.ProductID
         JOIN Events e ON ei.event_id = e.event_id
         WHERE e.report_approved = 1
           AND e.is_deleted = 0
           AND MONTH(e.start_date_time) = MONTH(GETDATE())
           AND YEAR(e.start_date_time) = YEAR(GETDATE())), 0) AS totalRevenue,

        -- Total units sold (only for events where report_approved = true in the current month)
        ISNULL((SELECT SUM(ei.sold) 
         FROM EventInventory ei 
         JOIN Events e ON ei.event_id = e.event_id
         WHERE e.report_approved = 1
           AND e.is_deleted = 0
           AND MONTH(e.start_date_time) = MONTH(GETDATE())
           AND YEAR(e.start_date_time) = YEAR(GETDATE())), 0) AS totalUnitsSold
    `);

    res.status(200).json(result.recordset[0]);


  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'Error fetching sales summary' });
  }
};