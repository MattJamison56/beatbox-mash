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

export const getQANumericalResults = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    // Query for products sampled
    const result = await pool.request().query(`
      SELECT
        P.ProductID,
        P.ProductName,
        
        -- Sum of the beginning inventory for each product
        ISNULL(SUM(EI.beginning_inventory), 0) AS totalInventory,
    
        -- Sum of the sold units for each product
        ISNULL(SUM(EI.sold), 0) AS totalSold
    
      FROM Products P
      LEFT JOIN EventInventory EI ON EI.product_id = P.ProductID
      LEFT JOIN Events E ON E.event_id = EI.event_id
      WHERE P.is_deleted = 0 
        AND E.is_deleted = 0 
        AND E.report_approved = 1 
        AND MONTH(E.start_date_time) = MONTH(GETDATE()) 
        AND YEAR(E.start_date_time) = YEAR(GETDATE())
      GROUP BY P.ProductID, P.ProductName;
    `);
    

    // Query for product sampling methods
    const samplingMethodsResult = await pool.request().query(`
      SELECT
        E.product_sampled_how,
        COUNT(*) AS count
      FROM EventReportQuestions E
      JOIN Events EV ON EV.event_id = E.event_id
      WHERE EV.is_deleted = 0 
        AND EV.report_approved = 1 
        AND MONTH(EV.start_date_time) = MONTH(GETDATE()) 
        AND YEAR(EV.start_date_time) = YEAR(GETDATE())
      GROUP BY E.product_sampled_how;
    `);

    // Query for first-time consumers data
    const firstTimeConsumersResult = await pool.request().query(`
      SELECT
        E.first_time_consumers,
        COUNT(*) AS count
      FROM EventReportQuestions E
      JOIN Events EV ON EV.event_id = E.event_id
      WHERE EV.is_deleted = 0 
        AND EV.report_approved = 1
        AND MONTH(EV.start_date_time) = MONTH(GETDATE())
        AND YEAR(EV.start_date_time) = YEAR(GETDATE())
      GROUP BY E.first_time_consumers;
    `);

    const data = result.recordset;
    const samplingMethodsData = samplingMethodsResult.recordset;
    const firstTimeConsumersData = firstTimeConsumersResult.recordset;
    const totalBeginningInventory = data.reduce((sum, item) => sum + (item.totalInventory || 0), 0);
    
    // Processing chart data here
    const productsSampled = data.map(item => ({
      productName: item.ProductName,
      count: item.totalInventory || 0, // Beginning inventory count
      percentage: totalBeginningInventory > 0 
        ? parseFloat(((item.totalInventory / totalBeginningInventory) * 100).toFixed(2)) 
        : 0, // Percentage of total beginning inventory
    }));

    // Process productSamplingMethods data (Chart 2)
    const possibleMethods: ('Chilled' | 'Over Ice' | 'In a cocktail' | 'Frozen/Slushie' | 'Other')[] = [
      'Chilled', 'Over Ice', 'In a cocktail', 'Frozen/Slushie', 'Other'
    ];
    
    const methodCounts: Record<'Chilled' | 'Over Ice' | 'In a cocktail' | 'Frozen/Slushie' | 'Other', number> = {
      'Chilled': 0,
      'Over Ice': 0,
      'In a cocktail': 0,
      'Frozen/Slushie': 0,
      'Other': 0
    };

    // Tally the counts for each method
    samplingMethodsData.forEach(item => {
      if (item.product_sampled_how) {
        const methods = item.product_sampled_how.split(',');
        methods.forEach((method: string) => {
          const trimmedMethod = method.trim() as 'Chilled' | 'Over Ice' | 'In a cocktail' | 'Frozen/Slushie' | 'Other';
          if (methodCounts[trimmedMethod] !== undefined) {
            methodCounts[trimmedMethod] += item.count;
          }
        });
      }
    });

    const totalEvents = samplingMethodsData.reduce((sum, item) => sum + item.count, 0);
    const productSamplingMethods = possibleMethods.map(method => ({
      method,
      percentage: totalEvents > 0 ? parseFloat(((methodCounts[method] / totalEvents) * 100).toFixed(2)) : 0,
      count: methodCounts[method], // Include the count of events sampled using each method
    }));

    // Process flavorsSold data (Chart 3)
    const totalProductsSold = data.reduce((sum, item) => sum + (item.totalSold || 0), 0);
    const flavorsSold = data.map(item => ({
      flavor: item.ProductName,
      percentage: totalProductsSold > 0 ? parseFloat(((item.totalSold / totalProductsSold) * 100).toFixed(2)) : 0,
      count: item.totalSold || 0, // Include the count of flavors sold
    }));

    // Process first-time consumers data (Chart 4 - Pie chart)
    const firstTimeConsumerOptions = ['less than 10%', '10% - 25%', '25% - 50%', '50% - 75%', '75% - 100%'];
    const firstTimeConsumersCounts: Record<string, number> = {
      'less than 10%': 0,
      '10% - 25%': 0,
      '25% - 50%': 0,
      '50% - 75%': 0,
      '75% - 100%': 0,
    };

    firstTimeConsumersData.forEach(item => {
      if (firstTimeConsumerOptions.includes(item.first_time_consumers)) {
        firstTimeConsumersCounts[item.first_time_consumers] += item.count;
      }
    });

    const totalFirstTimeConsumers = firstTimeConsumersData.reduce((sum, item) => sum + item.count, 0);
    const consumersFirstTime = firstTimeConsumerOptions.map(option => ({
      option,
      percentage: totalFirstTimeConsumers > 0 ? parseFloat(((firstTimeConsumersCounts[option] / totalFirstTimeConsumers) * 100).toFixed(2)) : 0,
      count: firstTimeConsumersCounts[option], // Include the actual count for each option
    }));

    res.status(200).json({
      productsSampled,
      productSamplingMethods,
      flavorsSold,
      consumersFirstTime,
    });
  } catch (error) {
    console.error('Error fetching Q&A numerical results:', error);
    res.status(500).json({ message: 'Error fetching data' });
  }
};


