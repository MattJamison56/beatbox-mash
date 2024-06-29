import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getProducts = async (req: Request, res: Response) => {
    try {
      const pool = await poolPromise;
      const request = new sql.Request(pool);
  
      const result = await request.query('SELECT * FROM Products');
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
        .query(`
          INSERT INTO Products (ProductName, Barcode, MSRP, ProductGroup)
          VALUES (@productName, @barcode, @msrp, @productGroup)
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
    try {
      const pool = await poolPromise;
      const request = new sql.Request(pool);
      const { id } = req.body;
  
      console.log('Deleting product with ID:', id);
  
      await request
        .input('id', sql.Int, id)
        .query('DELETE FROM Products WHERE ProductID = @id');
  
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  };