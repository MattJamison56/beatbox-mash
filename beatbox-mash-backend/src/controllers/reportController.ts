import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import s3 from '../awsConfig';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const saveInventorySalesData = async (req: Request, res: Response) => {
  const { eventId, inventoryData } = req.body;
  let transaction;

  try {
    const pool = await poolPromise;
    transaction = pool.transaction();

    // Begin the transaction
    await transaction.begin();

    // Delete existing records for the event
    await transaction.request()
      .input('eventId', sql.Int, eventId)
      .query('DELETE FROM EventInventory WHERE event_id = @eventId');

    // Insert new records
    for (const item of inventoryData) {
      const request = new sql.Request(transaction);
      await request
        .input('eventId', sql.Int, eventId)
        .input('productId', sql.Int, item.product_id)
        .input('beginningInventory', sql.Int, item.beginning_inventory)
        .input('endingInventory', sql.Int, item.ending_inventory)
        .input('sold', sql.Int, item.sold)
        .query(`
          INSERT INTO EventInventory (event_id, product_id, beginning_inventory, ending_inventory, sold)
          VALUES (@eventId, @productId, @beginningInventory, @endingInventory, @sold)
        `);
    }

    // Commit the transaction
    await transaction.commit();
    res.status(200).json({ message: 'Inventory sales data saved successfully' });
  } catch (error) {
    console.error('Error saving inventory sales data:', error);

    // Rollback the transaction in case of error
    if (transaction) {
      await transaction.rollback();
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const getInventorySalesData = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);

    const result = await request
      .input('eventId', sql.Int, eventId)
      .query('SELECT ei.*, p.ProductName FROM EventInventory ei JOIN Products p ON ei.product_id = p.ProductID WHERE ei.event_id = @eventId');

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error retrieving inventory sales data:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const getReportQuestionsData = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);

    const result = await request
      .input('event_id', sql.Int, eventId)
      .query('SELECT * FROM EventReportQuestions WHERE event_id = @event_id');

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'No data found' });
    }
  } catch (error) {
    console.error('Error retrieving report questions data:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const saveReportQuestionsData = async (req: Request, res: Response) => {
  const {
    eventId,
    sampledFlavors,
    price,
    consumers_sampled,
    consumers_engaged,
    total_attendees,
    beatboxes_purchased,
    first_time_consumers,
    product_sampled_how,
    top_reason_bought,
    top_reason_didnt_buy,
    qr_scans,
    table_location,
    swag,
    customer_feedback,
    other_feedback
  } = req.body;

  const productSampledHowArray = Array.isArray(product_sampled_how) ? product_sampled_how : [];

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const request = new sql.Request(transaction);

    await request
      .input('event_id', sql.Int, eventId)
      .input('sampled_flavors', sql.NVarChar, sampledFlavors.join(','))
      .input('price', sql.NVarChar, price)
      .input('consumers_sampled', sql.Int, consumers_sampled)
      .input('consumers_engaged', sql.Int, consumers_engaged)
      .input('total_attendees', sql.Int, total_attendees)
      .input('beatboxes_purchased', sql.Int, beatboxes_purchased)
      .input('first_time_consumers', sql.NVarChar, first_time_consumers)
      .input('product_sampled_how', sql.NVarChar, productSampledHowArray.join(','))
      .input('top_reason_bought', sql.NVarChar, top_reason_bought)
      .input('top_reason_didnt_buy', sql.NVarChar, top_reason_didnt_buy)
      .input('qr_scans', sql.Int, qr_scans)
      .input('table_location', sql.NVarChar, table_location)
      .input('swag', sql.NVarChar, swag)
      .input('customer_feedback', sql.NVarChar, customer_feedback)
      .input('other_feedback', sql.NVarChar, other_feedback)
      .query(`
        MERGE INTO EventReportQuestions AS target
        USING (SELECT @event_id AS event_id) AS source
        ON (target.event_id = source.event_id)
        WHEN MATCHED THEN
          UPDATE SET 
            sampled_flavors = @sampled_flavors,
            price = @price,
            consumers_sampled = @consumers_sampled,
            consumers_engaged = @consumers_engaged,
            total_attendees = @total_attendees,
            beatboxes_purchased = @beatboxes_purchased,
            first_time_consumers = @first_time_consumers,
            product_sampled_how = @product_sampled_how,
            top_reason_bought = @top_reason_bought,
            top_reason_didnt_buy = @top_reason_didnt_buy,
            qr_scans = @qr_scans,
            table_location = @table_location,
            swag = @swag,
            customer_feedback = @customer_feedback,
            other_feedback = @other_feedback
        WHEN NOT MATCHED THEN
          INSERT (event_id, sampled_flavors, price, consumers_sampled, consumers_engaged, total_attendees, beatboxes_purchased, first_time_consumers, product_sampled_how, top_reason_bought, top_reason_didnt_buy, qr_scans, table_location, swag, customer_feedback, other_feedback)
          VALUES (@event_id, @sampled_flavors, @price, @consumers_sampled, @consumers_engaged, @total_attendees, @beatboxes_purchased, @first_time_consumers, @product_sampled_how, @top_reason_bought, @top_reason_didnt_buy, @qr_scans, @table_location, @swag, @customer_feedback, @other_feedback);
      `);

    await transaction.commit();

    res.status(200).json({ message: 'Report questions data saved successfully' });
  } catch (error) {
    console.error('Error saving report questions data:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const uploadPhotos = async (req: Request, res: Response) => {
  const { eventId } = req.body;
  let files = req.files?.files;

  if (!files) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  if (!process.env.AWS_S3_BUCKET_NAME) {
    return res.status(500).json({ message: 'AWS S3 bucket name is not defined.' });
  }

  if (!Array.isArray(files)) {
    files = [files]; // Normalize to an array
  }

  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    for (const file of files) {
      console.log('Processing file:', file); // Log each file object

      if (!file || !file.name) {
        throw new Error('Invalid file object');
      }

      const fileName = uuidv4() + path.extname(file.name);
      const filePath = path.join(uploadDir, fileName);

      await file.mv(filePath);

      const fileContent = fs.readFileSync(filePath);

      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      const s3Upload = await s3.send(command);

      fs.unlinkSync(filePath);

      const request = new sql.Request(transaction!);
      await request
        .input('event_id', sql.Int, eventId)
        .input('file_name', sql.NVarChar, file.name)
        .input('file_path', sql.NVarChar, `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`)
        .query(`
          INSERT INTO EventPhotos (event_id, file_name, file_path)
          VALUES (@event_id, @file_name, @file_path)
        `);
    }

    await transaction.commit();
    res.status(200).json({ message: 'Photos uploaded successfully' });
  } catch (error) {
    console.error('Error uploading photos:', error);

    if (transaction) {
      await transaction.rollback();
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const uploadReceipts = async (req: Request, res: Response) => {
  const { eventId, date, notes, category, paymentMethod, items } = req.body;
  let files = req.files?.files;

  if (!files) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  if (!Array.isArray(files)) {
    files = [files]; // Normalize to an array
  }

  if (!process.env.AWS_S3_RECEIPT_BUCKET_NAME) {
    return res.status(500).json({ message: 'AWS S3 receipt bucket name is not defined.' });
  }

  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    let totalAmount = 0;
    const itemsArray = JSON.parse(items);
    itemsArray.forEach((item: { name: string; amount: number }) => {
      totalAmount += item.amount;
    });

    const receiptInsertResult = await transaction.request()
      .input('event_id', sql.Int, eventId)
      .input('date', sql.Date, date)
      .input('notes', sql.NVarChar, notes)
      .input('category', sql.NVarChar, category)
      .input('payment_method', sql.NVarChar, paymentMethod)
      .input('total_amount', sql.Decimal, totalAmount)
      .query(`
        INSERT INTO Receipts (event_id, date, notes, category, payment_method, total_amount)
        OUTPUT Inserted.receipt_id
        VALUES (@event_id, @date, @notes, @category, @payment_method, @total_amount)
      `);

    const receiptId = receiptInsertResult.recordset[0].receipt_id;

    for (const item of itemsArray) {
      await transaction.request()
        .input('receipt_id', sql.Int, receiptId)
        .input('item_name', sql.NVarChar, item.name)
        .input('amount', sql.Decimal, item.amount)
        .query(`
          INSERT INTO ReceiptItems (receipt_id, item_name, amount)
          VALUES (@receipt_id, @item_name, @amount)
        `);
    }

    for (const file of files) {
      const fileName = uuidv4() + path.extname(file.name);
      const filePath = path.join(uploadDir, fileName);

      await file.mv(filePath);

      const fileContent = fs.readFileSync(filePath);

      const params = {
        Bucket: process.env.AWS_S3_RECEIPT_BUCKET_NAME!,
        Key: fileName,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const fileUrl = `https://${process.env.AWS_S3_RECEIPT_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      fs.unlinkSync(filePath);

      await transaction.request()
        .input('receipt_id', sql.Int, receiptId)
        .input('file_name', sql.NVarChar, file.name)
        .input('file_path', sql.NVarChar, fileUrl)
        .query(`
          UPDATE Receipts
          SET file_name = @file_name, file_path = @file_path
          WHERE receipt_id = @receipt_id
        `);
    }

    await transaction.commit();
    res.status(200).json({ message: 'Receipts uploaded successfully' });
  } catch (error) {
    console.error('Error uploading receipts:', error);

    if (transaction) {
      await transaction.rollback();
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const saveMileageReport = async (req: Request, res: Response) => {
  const { eventId, locations, totalMileage, totalFee, category, notes } = req.body;
  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);

    // Begin the transaction
    await transaction.begin();

    // Insert the mileage report
    const reportResult = await transaction.request()
      .input('eventId', sql.Int, eventId)
      .input('totalMileage', sql.Float, totalMileage)
      .input('totalFee', sql.Decimal(10, 2), totalFee)
      .input('category', sql.NVarChar(50), category)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .query(`
        INSERT INTO MileageReports (eventId, totalMileage, totalFee, category, notes)
        OUTPUT Inserted.ReportId
        VALUES (@eventId, @totalMileage, @totalFee, @category, @notes)
      `);

    const reportId = reportResult.recordset[0].ReportId;

    // Insert the locations
    for (const location of locations) {
      await transaction.request()
        .input('reportId', sql.Int, reportId)
        .input('address', sql.NVarChar(255), location.address)
        .input('lat', sql.Float, location.lat)
        .input('lng', sql.Float, location.lng)
        .query(`
          INSERT INTO Locations (reportId, address, lat, lng)
          VALUES (@reportId, @address, @lat, @lng)
        `);
    }

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Mileage report saved successfully' });
  } catch (error) {
    console.error('Error saving mileage report:', error);

    // Rollback the transaction in case of error
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error saving mileage report' });
  }
};