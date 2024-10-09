// controllers/authController.ts
import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';
import ExcelJS from 'exceljs';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

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
              AND e.report_approved = 1 -- Only include approved events
            THEN ei.sold 
            ELSE 0 END), 0) AS unitsSold,

        -- Dollar amount of units sold (units sold * MSRP) in the current month
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN ei.sold * p.MSRP 
            ELSE 0 END), 0) AS totalDollarSales,

        -- Average sales per event (demos) in the current month
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN ei.sold 
            ELSE 0 END) * 1.0 / NULLIF(COUNT(DISTINCT CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN e.event_id 
            ELSE NULL END), 0), 0) AS avgSalesPerDemo,

        -- Number of demos/events the product was part of in the current month
        COUNT(DISTINCT CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN e.event_id 
            ELSE NULL END) AS demosByProduct,

        -- Percentage of products not sold at demos in the current month
        CASE 
          WHEN SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN ei.beginning_inventory 
            ELSE 0 END) = 0 THEN 0
          ELSE ROUND(100 * (1 - (SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
            THEN ei.sold 
            ELSE 0 END) * 1.0 / SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1 -- Only include approved events
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

    console.log(result.recordset);
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
      -- Step 1: Calculate unique event hours per BA
      WITH UniqueEventHours AS (
          SELECT
              U.id AS baId,
              U.name AS baName,
              U.avatar_url AS baAvatarUrl,
              E.event_id AS eventId,
              SUM(E.duration_hours + (E.duration_minutes / 60.0)) AS eventDurationInHours
          FROM
              Users U
          JOIN
              EventBrandAmbassadors EBA ON U.id = EBA.ba_id
          JOIN
              Events E ON EBA.event_id = E.event_id
          WHERE
              E.is_deleted = 0
              AND E.report_approved = 1
              AND MONTH(E.start_date_time) = MONTH(GETDATE())
              AND YEAR(E.start_date_time) = YEAR(GETDATE())
          GROUP BY
              U.id, U.name, U.avatar_url, E.event_id
      ),
      -- Step 2: Aggregate sales information separately
      EventSales AS (
          SELECT
              EI.event_id,
              SUM(EI.sold) AS totalUnitsSold,
              SUM(EI.sold * P.MSRP) AS totalDollarSales
          FROM
              EventInventory EI
          LEFT JOIN
              Products P ON EI.product_id = P.ProductID
          GROUP BY
              EI.event_id
      )
      -- Step 3: Join the unique event hours with the sales data
      SELECT
          U.baId,
          U.baName,
          U.baAvatarUrl,
          COUNT(DISTINCT U.eventId) AS demosLastMonth,
          SUM(U.eventDurationInHours) AS totalHoursWorked,
          SUM(ES.totalUnitsSold) AS totalUnitsSold,
          SUM(ES.totalDollarSales) AS totalDollarSales,
          SUM(ES.totalUnitsSold) / SUM(U.eventDurationInHours) AS salesPerHour
      FROM
          UniqueEventHours U
      LEFT JOIN
          EventSales ES ON U.eventId = ES.event_id
      GROUP BY
          U.baId, U.baName, U.baAvatarUrl
      ORDER BY
          U.baName;
      
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

export const exportProductDataToExcel = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    // Fetch product data
    const result = await pool.request().query(`
      SELECT
        p.ProductID,
        p.ProductName,
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
          THEN ei.sold 
          ELSE 0 END), 0) AS unitsSold,
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
          THEN ei.sold * p.MSRP 
          ELSE 0 END), 0) AS totalDollarSales,
        ISNULL(SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
          THEN ei.sold 
          ELSE 0 END) * 1.0 / NULLIF(COUNT(DISTINCT CASE 
          WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
            AND YEAR(e.start_date_time) = YEAR(GETDATE())
            AND e.report_approved = 1
          THEN e.event_id 
          ELSE NULL END), 0), 0) AS avgSalesPerDemo,
        COUNT(DISTINCT CASE 
          WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
            AND YEAR(e.start_date_time) = YEAR(GETDATE())
            AND e.report_approved = 1
          THEN e.event_id 
          ELSE NULL END) AS demosByProduct,
        CASE 
          WHEN SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
            THEN ei.beginning_inventory 
            ELSE 0 END) = 0 THEN 0
          ELSE ROUND(100 * (1 - (SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
            THEN ei.sold 
            ELSE 0 END) * 1.0 / SUM(CASE 
            WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
              AND YEAR(e.start_date_time) = YEAR(GETDATE())
              AND e.report_approved = 1
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

    const productData = result.recordset;

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Product Data');

    let currentRow = 1;

    // Generate charts on the backend
    const chartConfigurations = getChartConfigurationsProduct(productData);
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });

    for (const config of chartConfigurations) {
      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config.chartConfig);

      const imageId = workbook.addImage({
        buffer: imageBuffer,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: currentRow - 1 },
        ext: { width: 600, height: 400 },
      });

      // Add chart title
      worksheet.getCell(`A${currentRow}`).value = config.title;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getRow(currentRow).height = 20;

      currentRow += 22; // Adjust as needed based on image size
    }

    // Define columns without headers
    worksheet.columns = [
      { key: 'ProductName', width: 30 },
      { key: 'demosByProduct', width: 15 },
      { key: 'unitsSold', width: 15 },
      { key: 'totalDollarSales', width: 20 },
      { key: 'avgSalesPerDemo', width: 20 },
      { key: 'percentNotSoldAtDemo', width: 20 },
    ];

    // Insert header row at the current position
    worksheet.spliceRows(currentRow, 0, [
      'Product Name',
      '# Demos',
      '# Units Sold',
      '$ Units Sold',
      '$ Avg Sales per Demo',
      '% Not Sold at Demo',
    ]);

    // Style the header row
    const headerRow = worksheet.getRow(currentRow);
    headerRow.font = { bold: true };

    currentRow += 1;

    // Add data rows starting from the next row
    productData.forEach((product) => {
      worksheet.insertRow(currentRow, [
        product.ProductName,
        product.demosByProduct,
        product.unitsSold,
        product.totalDollarSales,
        product.avgSalesPerDemo,
        product.percentNotSoldAtDemo / 100, // Convert to fraction for percentage format
      ]);
      currentRow += 1;
    });

    // Format currency columns
    worksheet.getColumn(4).numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00'; // Column 4: '$ Units Sold'
    worksheet.getColumn(5).numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00'; // Column 5: '$ Avg Sales per Demo'

    // Format percentage column
    worksheet.getColumn(6).numFmt = '0.00%'; // Column 6: '% Not Sold at Demo'

    // Send the workbook to the client
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=ProductData.xlsx'
    );

    await workbook.xlsx.write(res);
    // Do not call res.end(), write() handles it
  } catch (error) {
    console.error('Error exporting product data to Excel:', error);
    res.status(500).send('Error exporting product data to Excel');
  }
};

// Helper function to generate chart configurations
function getChartConfigurationsProduct(productData: any[]) {
  const labels = productData.map((item: { ProductName: any; }) => item.ProductName);

  return [
    {
      title: 'Units Sold',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Units Sold',
              data: productData.map((item: { unitsSold: any; }) => item.unitsSold),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Units Sold',
            },
          },
        },
      },
    },
    {
      title: 'Average Sales',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Average Sales',
              data: productData.map((item: { avgSalesPerDemo: any; }) => item.avgSalesPerDemo),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Average Sales',
            },
          },
        },
      },
    },
    {
      title: '# Demos by Product',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '# Demos by Product',
              data: productData.map((item: { demosByProduct: any; }) => item.demosByProduct),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: '# Demos by Product',
            },
          },
        },
      },
    },
    {
      title: '% Not Sold at Demo',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '% Not Sold at Demo',
              data: productData.map((item: { percentNotSoldAtDemo: any; }) => item.percentNotSoldAtDemo),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: '% Not Sold at Demo',
            },
          },
        },
      },
    },
  ];
}

export const exportBrandAmbassadorsDataToExcel = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    // Fetch BA data
    const result = await pool.request().query(`
      WITH UniqueEventHours AS (
          SELECT
              U.id AS baId,
              U.name AS baName,
              U.avatar_url AS baAvatarUrl,
              E.event_id AS eventId,
              SUM(E.duration_hours + (E.duration_minutes / 60.0)) AS eventDurationInHours
          FROM
              Users U
          JOIN
              EventBrandAmbassadors EBA ON U.id = EBA.ba_id
          JOIN
              Events E ON EBA.event_id = E.event_id
          WHERE
              E.is_deleted = 0
              AND E.report_approved = 1
              AND MONTH(E.start_date_time) = MONTH(GETDATE())
              AND YEAR(E.start_date_time) = YEAR(GETDATE())
          GROUP BY
              U.id, U.name, U.avatar_url, E.event_id
      ),
      EventSales AS (
          SELECT
              EI.event_id,
              SUM(EI.sold) AS totalUnitsSold,
              SUM(EI.sold * P.MSRP) AS totalDollarSales
          FROM
              EventInventory EI
          LEFT JOIN
              Products P ON EI.product_id = P.ProductID
          GROUP BY
              EI.event_id
      )
      SELECT
          U.baId,
          U.baName,
          U.baAvatarUrl,
          COUNT(DISTINCT U.eventId) AS demosLastMonth,
          SUM(U.eventDurationInHours) AS totalHoursWorked,
          SUM(ES.totalUnitsSold) AS totalUnitsSold,
          SUM(ES.totalDollarSales) AS totalDollarSales,
          CASE WHEN SUM(U.eventDurationInHours) > 0 THEN SUM(ES.totalUnitsSold) / SUM(U.eventDurationInHours) ELSE 0 END AS salesPerHour
      FROM
          UniqueEventHours U
      LEFT JOIN
          EventSales ES ON U.eventId = ES.event_id
      GROUP BY
          U.baId, U.baName, U.baAvatarUrl
      ORDER BY
          U.baName;
    `);
    
    if (!result.recordset || result.recordset.length === 0) {
      console.error('No data returned from the database.');
      res.status(500).send('No data returned from the database.');
      return;
    }

    const baData = result.recordset.map((ba) => ({
      ...ba,
      avgSalesPerDemo: ba.totalUnitsSold / ba.demosLastMonth || 0,
      avgDollarSalesPerDemo: ba.totalDollarSales / ba.demosLastMonth || 0,
      avgHoursPerDemo: ba.totalHoursWorked / ba.demosLastMonth || 0,
      dollarSalesPerHour: ba.totalDollarSales / ba.totalHoursWorked || 0,
    }));

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Brand Ambassadors Data');

    let currentRow = 1;

    // Generate charts on the backend
    const chartConfigurations = getChartConfigurations(baData);
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });

    for (const config of chartConfigurations) {
      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config.chartConfig);

      const imageId = workbook.addImage({
        buffer: imageBuffer,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: currentRow - 1 },
        ext: { width: 600, height: 400 },
      });

      // Add chart title
      worksheet.getCell(`A${currentRow}`).value = config.title;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getRow(currentRow).height = 20;

      currentRow += 22; // Adjust as needed based on image size
    }

    // Define columns
    worksheet.columns = [
      { header: 'BA Name', key: 'baName', width: 30 },
      { header: '# Demos', key: 'demosLastMonth', width: 15 },
      { header: '# Total Sales', key: 'totalUnitsSold', width: 15 },
      { header: '$ Total Sales', key: 'totalDollarSales', width: 20 },
      { header: '# Avg Sales per Demo', key: 'avgSalesPerDemo', width: 20 },
      { header: '$ Avg Sales per Demo', key: 'avgDollarSalesPerDemo', width: 20 },
      { header: 'Total Hours', key: 'totalHoursWorked', width: 15 },
      { header: 'Avg Hours per Demo', key: 'avgHoursPerDemo', width: 15 },
      { header: '# Sales per Demo Hour', key: 'salesPerHour', width: 20 },
      { header: '$ Sales per Demo Hour', key: 'dollarSalesPerHour', width: 20 },
    ];

    // Add data rows starting from the current row
    baData.forEach((ba) => {
      worksheet.addRow({
        baName: ba.baName,
        demosLastMonth: ba.demosLastMonth,
        totalUnitsSold: ba.totalUnitsSold,
        totalDollarSales: ba.totalDollarSales,
        avgSalesPerDemo: ba.avgSalesPerDemo,
        avgDollarSalesPerDemo: ba.avgDollarSalesPerDemo,
        totalHoursWorked: ba.totalHoursWorked,
        avgHoursPerDemo: ba.avgHoursPerDemo,
        salesPerHour: ba.salesPerHour,
        dollarSalesPerHour: ba.dollarSalesPerHour,
      });
    });

    // Style the header row
    const headerRow = worksheet.getRow(currentRow);
    headerRow.font = { bold: true };

    // Format currency columns
    worksheet.getColumn('totalDollarSales').numFmt = '"$"#,##0.00';
    worksheet.getColumn('avgDollarSalesPerDemo').numFmt = '"$"#,##0.00';
    worksheet.getColumn('dollarSalesPerHour').numFmt = '"$"#,##0.00';

    // Send the workbook to the client
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=BrandAmbassadorsData.xlsx');

    await workbook.xlsx.write(res);
    // Do not call res.end(), write() handles it
  } catch (error) {
    console.error('Error exporting brand ambassadors data to Excel:', error);
    res.status(500).send('Error exporting brand ambassadors data to Excel');
  }
};

// Helper function to generate chart configurations
function getChartConfigurations(baData) {
  const labels = baData.map((item) => item.baName);

  return [
    {
      title: 'Demos by BA',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Demos by BA',
              data: baData.map((item) => item.demosLastMonth),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Demos by BA',
            },
          },
        },
      },
    },
    {
      title: 'Sales per Hour',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Sales per Hour',
              data: baData.map((item) => item.salesPerHour),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Sales per Hour',
            },
          },
        },
      },
    },
    {
      title: 'Total Hours by BA',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Total Hours by BA',
              data: baData.map((item) => item.totalHoursWorked),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Total Hours by BA',
            },
          },
        },
      },
    },
    {
      title: 'Total Sales by BA',
      chartConfig: {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Total Sales by BA',
              data: baData.map((item) => item.totalDollarSales),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Total Sales by BA',
            },
          },
        },
      },
    },
  ];
}