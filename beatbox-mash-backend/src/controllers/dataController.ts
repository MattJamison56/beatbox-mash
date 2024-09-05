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

export const getBrandAmbassadorsData = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        U.id AS baId,
        U.name AS baName,
        U.avatar_url AS baAvatarUrl,
        COUNT(DISTINCT E.event_id) AS demosLastMonth,
        SUM(E.duration_hours + (E.duration_minutes / 60.0)) AS totalHoursWorked,
        SUM(EI.sold) AS totalUnitsSold,
        SUM(EI.sold * P.MSRP) AS totalDollarSales,
        SUM(EI.sold) / SUM(E.duration_hours + (E.duration_minutes / 60.0)) AS salesPerHour
      FROM Users U
      JOIN EventBrandAmbassadors EBA ON U.id = EBA.ba_id
      JOIN Events E ON EBA.event_id = E.event_id
      LEFT JOIN EventInventory EI ON E.event_id = EI.event_id
      LEFT JOIN Products P ON EI.product_id = P.ProductID
      WHERE E.is_deleted = 0
      AND E.report_approved = 1
      AND MONTH(E.start_date_time) = MONTH(GETDATE()) -- Current month
      AND YEAR(E.start_date_time) = YEAR(GETDATE()) -- Current year
      GROUP BY U.id, U.name, U.avatar_url
    `);

    const brandAmbassadors = result.recordset.map((ba) => ({
      ...ba,
      avgSalesPerDemo: ba.totalUnitsSold / ba.demosLastMonth || 0,
      avgDollarSalesPerDemo: ba.totalDollarSales / ba.demosLastMonth || 0,
      avgHoursPerDemo: ba.totalHoursWorked / ba.demosLastMonth || 0
    }));

    res.status(200).json(brandAmbassadors);
  } catch (error) {
    console.error('Error fetching brand ambassadors data:', error);
    res.status(500).json({ message: 'Error fetching brand ambassadors data' });
  }
};

export const getVenueData = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        V.id AS venueId,
        V.name AS venueName,
        V.region AS state,
        V.address AS city,
        
        -- Number of demos by venue (count distinct events)
        COUNT(DISTINCT E.event_id) AS demosLastMonth,
        
        -- Total units sold at venue in the current month
        ISNULL(SUM(EI.sold), 0) AS totalUnitsSold,
        
        -- Total dollar sales at venue (units sold * MSRP)
        ISNULL(SUM(EI.sold * P.MSRP), 0) AS totalDollarSales,
        
        -- Average sales per demo
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold) * 1.0 / COUNT(DISTINCT E.event_id), 0)
        END AS avgSalesPerDemo,

        -- Average dollar sales per demo
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold * P.MSRP) * 1.0 / COUNT(DISTINCT E.event_id), 0)
        END AS avgDollarSalesPerDemo,

        -- Total hours worked at venue (distinct events only)
        ISNULL(SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)), 0) AS totalHoursWorked,

        -- Average hours per demo
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)) / COUNT(DISTINCT E.event_id), 0)
        END AS avgHoursPerDemo,
        
        -- Sales per hour
        CASE 
          WHEN SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold) / SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)), 0)
        END AS salesPerHour,

        -- Dollar sales per hour
        CASE 
          WHEN SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold * P.MSRP) / SUM(DISTINCT E.duration_hours + (E.duration_minutes / 60.0)), 0)
        END AS dollarSalesPerHour

      FROM Venues V
      JOIN Events E ON V.id = E.venue_id
      LEFT JOIN EventInventory EI ON E.event_id = EI.event_id
      LEFT JOIN Products P ON EI.product_id = P.ProductID
      WHERE E.is_deleted = 0
        AND E.report_approved = 1
        AND MONTH(E.start_date_time) = MONTH(GETDATE())
        AND YEAR(E.start_date_time) = YEAR(GETDATE())
      GROUP BY V.id, V.name, V.region, V.address
      ORDER BY V.name;
    `);

    res.status(200).json(result.recordset);
    
  } catch (error) {
    console.error('Error fetching venue data:', error);
    res.status(500).json({ message: 'Error fetching venue data' });
  }
};

export const getStateData = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        V.region AS state,  -- Group by state (region in the venue table)
        
        -- Number of demos (count distinct events)
        COUNT(DISTINCT E.event_id) AS demosLastMonth,
        
        -- Total demo hours worked in the current month
        ISNULL(SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))), 0) AS totalDemoHours,

        -- Average hours per demo in the current month
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))) / COUNT(DISTINCT E.event_id), 0)
        END AS avgHoursPerDemo,

        -- Total units sold by state
        ISNULL(SUM(EI.sold), 0) AS totalUnitsSold,
        
        -- Total dollar sales (units sold * MSRP) by state
        ISNULL(SUM(EI.sold * P.MSRP), 0) AS totalDollarSales,

        -- Average sales per demo by state
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold) * 1.0 / COUNT(DISTINCT E.event_id), 0)
        END AS avgSalesPerDemo,

        -- Average dollar sales per demo by state
        CASE 
          WHEN COUNT(DISTINCT E.event_id) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold * P.MSRP) * 1.0 / COUNT(DISTINCT E.event_id), 0)
        END AS avgDollarSalesPerDemo,

        -- Sales per demo hour by state
        CASE 
          WHEN SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold) / SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))), 0)
        END AS salesPerHour,

        -- Dollar sales per demo hour by state
        CASE 
          WHEN SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))) = 0 THEN 0
          ELSE ISNULL(SUM(EI.sold * P.MSRP) / SUM(DISTINCT (E.duration_hours + (E.duration_minutes / 60.0))), 0)
        END AS dollarSalesPerHour

      FROM Venues V
      JOIN Events E ON V.id = E.venue_id
      LEFT JOIN EventInventory EI ON E.event_id = EI.event_id
      LEFT JOIN Products P ON EI.product_id = P.ProductID
      WHERE E.is_deleted = 0
        AND E.report_approved = 1
        AND MONTH(E.start_date_time) = MONTH(GETDATE())  -- Filter by current month
        AND YEAR(E.start_date_time) = YEAR(GETDATE())
      GROUP BY V.region
      ORDER BY V.region;
    `);

    console.log(result.recordset);

    res.status(200).json(result.recordset);
    
  } catch (error) {
    console.error('Error fetching state data:', error);
    res.status(500).json({ message: 'Error fetching state data' });
  }
};
