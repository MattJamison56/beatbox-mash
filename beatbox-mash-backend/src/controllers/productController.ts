import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);

    // Filter out products where is_deleted = 1
    const result = await request.query('SELECT * FROM Products WHERE is_deleted = 0');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error retrieving products:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};


export const createProducts = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { products } = req.body;

    console.log('Creating products:', products); // Log input data

    for (const product of products) {
      console.log('Processing product:', product); // Log each product

      const requestProduct = new sql.Request(transaction);

      await requestProduct
        .input('productName', sql.NVarChar, product.productName)
        .input('barcode', sql.NVarChar, product.barcode)
        .input('msrp', sql.Decimal(10, 2), product.msrp)
        .input('productGroup', sql.NVarChar, product.productGroup)
        .input('productWorth', sql.Int, product.productWorth) // Add input for ProductWorth
        .query(`
          INSERT INTO Products (ProductName, Barcode, MSRP, ProductGroup, ProductWorth)
          VALUES (@productName, @barcode, @msrp, @productGroup, @productWorth)
        `);
    }

    await transaction.commit();
    res.status(200).json({ message: 'Products created successfully' });
  } catch (error) {
    console.error('Error creating products:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.body;
  let transaction;

  try {
    const pool = await poolPromise;
    transaction = pool.transaction();

    // Begin the transaction
    await transaction.begin();

    // Mark the product as deleted instead of actually deleting it
    await transaction.request()
      .input('id', sql.Int, id)
      .query('UPDATE Products SET is_deleted = 1 WHERE ProductID = @id');

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);

    // Rollback the transaction in case of error
    if (transaction) {
      await transaction.rollback();
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};