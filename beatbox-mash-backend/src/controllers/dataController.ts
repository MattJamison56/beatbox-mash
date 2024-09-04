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
      
      -- Total units sold for each product
      ISNULL(SUM(ei.sold), 0) AS unitsSold,
    
      -- Average sales per event (demos) - calculated as total sold units divided by number of demos
      ISNULL(SUM(ei.sold) * 1.0 / NULLIF(COUNT(DISTINCT e.event_id), 0), 0) AS avgSalesPerDemo,
    
      -- Number of demos/events the product was part of
      COUNT(DISTINCT e.event_id) AS demosByProduct,
    
      -- Percentage of products not sold at demos
      CASE 
        WHEN SUM(ei.beginning_inventory) = 0 THEN 0
        ELSE ROUND(100 * (1 - (SUM(ei.sold) * 1.0 / SUM(ei.beginning_inventory))), 1)
      END AS percentNotSoldAtDemo
    
    FROM Products p
    LEFT JOIN EventInventory ei ON p.ProductID = ei.product_id
    LEFT JOIN Events e ON ei.event_id = e.event_id
    WHERE p.is_deleted = 0 AND e.is_deleted = 0
    GROUP BY p.ProductID, p.ProductName
    ORDER BY p.ProductName;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ message: 'Error fetching product data' });
  }
};

// For Monthly Calculation (Uncomment for monthly filtering)
// WHEN MONTH(e.start_date_time) = MONTH(GETDATE()) 
// AND YEAR(e.start_date_time) = YEAR(GETDATE()) 
// THEN ei.sold 
