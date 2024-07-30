import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

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

