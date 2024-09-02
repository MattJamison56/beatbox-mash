import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import s3 from '../awsConfig';
import { v4 as uuidv4 } from 'uuid';
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import stream from 'stream';
import util from 'util';

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
  const { eventId, date, notes, category, paymentMethod, items, ba_id } = req.body;
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
      .input('ba_id', sql.Int, ba_id)  // Include ba_id in the insert
      .query(`
        INSERT INTO Receipts (event_id, date, notes, category, payment_method, total_amount, ba_id)
        OUTPUT Inserted.receipt_id
        VALUES (@event_id, @date, @notes, @category, @payment_method, @total_amount, @ba_id)
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
  const { eventId, locations, totalMileage, totalFee, category, notes, ba_id } = req.body;
  let transaction: sql.Transaction | undefined;

  try {
    const parsedLocations = typeof locations === 'string' ? JSON.parse(locations) : locations;

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    const reportResult = await transaction.request()
      .input('eventId', sql.Int, eventId)
      .input('totalMileage', sql.Float, totalMileage)
      .input('totalFee', sql.Decimal(10, 2), totalFee)
      .input('category', sql.NVarChar(50), category)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .input('ba_id', sql.Int, ba_id)  // Include ba_id in the insert
      .query(`
        INSERT INTO MileageReports (eventId, totalMileage, totalFee, category, notes, ba_id)
        OUTPUT Inserted.ReportId
        VALUES (@eventId, @totalMileage, @totalFee, @category, @notes, @ba_id)
      `);

    const reportId = reportResult.recordset[0].ReportId;

    for (const location of parsedLocations) {
      await transaction.request()
        .input('reportId', sql.Int, reportId)
        .input('address', sql.NVarChar(255), location.address)
        .input('lat', sql.Float, location.lat)
        .input('lng', sql.Float, location.lng)
        .query(`
          INSERT INTO Locations (ReportId, Address, Latitude, Longitude)
          VALUES (@reportId, @address, @lat, @lng)
        `);
    }

    await transaction.commit();

    res.status(200).json({ message: 'Mileage report saved successfully' });
  } catch (error) {
    console.error('Error saving mileage report:', error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error saving mileage report' });
  }
};

export const saveOtherExpense = async (req: Request, res: Response) => {
  const { eventId, category, paymentMethod, date, amount, notes, ba_id } = req.body;
  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    await transaction.request()
      .input('eventId', sql.Int, eventId)
      .input('category', sql.NVarChar(50), category)
      .input('paymentMethod', sql.NVarChar(50), paymentMethod)
      .input('date', sql.Date, date)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .input('ba_id', sql.Int, ba_id)  // Include ba_id in the insert
      .query(`
        INSERT INTO OtherExpenses (EventId, Category, PaymentMethod, Date, Amount, Notes, ba_id)
        VALUES (@eventId, @category, @paymentMethod, @date, @amount, @notes, @ba_id)
      `);

    await transaction.commit();

    res.status(200).json({ message: 'Other expense saved successfully' });
  } catch (error) {
    console.error('Error saving other expense:', error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error saving other expense' });
  }
};


const pipeline = util.promisify(stream.pipeline);

export const submitAndGenerateReport = async (req: Request, res: Response) => {
  const { eventId, baId, inventoryFilled, questionsFilled, photosFilled, expensesFilled } = req.body;
  let transaction: sql.Transaction | null = null;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    if (inventoryFilled && questionsFilled && photosFilled && expensesFilled) {
      // Fetch event and ambassador details
      const result = await pool.request()
        .input('eventId', sql.Int, eventId)
        .query(`
          SELECT 
            e.event_name AS eventName,
            e.start_date_time AS startDateTime,
            e.duration_hours,
            e.duration_minutes,
            c.name AS campaign,
            v.name AS venue,
            v.address,
            u.name AS brandAmbassador,
            erq.sampled_flavors,
            erq.price,
            erq.consumers_sampled,
            erq.consumers_engaged,
            erq.total_attendees,
            erq.beatboxes_purchased,
            erq.first_time_consumers,
            erq.product_sampled_how,
            erq.top_reason_bought,
            erq.top_reason_didnt_buy,
            erq.qr_scans,
            erq.table_location,
            erq.swag,
            erq.customer_feedback,
            erq.other_feedback,
            ep.file_name,
            ep.file_path
          FROM 
            Events e
          JOIN 
            Venues v ON e.venue_id = v.id
          JOIN 
            Campaigns c ON e.campaign_id = c.id
          JOIN 
            EventBrandAmbassadors eba ON e.event_id = eba.event_id
          JOIN 
            Users u ON eba.ba_id = u.id
          JOIN 
            EventReportQuestions erq ON e.event_id = erq.event_id
          LEFT JOIN 
            EventPhotos ep ON e.event_id = ep.event_id
          WHERE 
            e.event_id = @eventId
        `);
      
      console.log('Fetched event details:', result.recordset);

      const event = result.recordset[0];

      const inventoryResult = await pool.request()
        .input('eventId', sql.Int, eventId)
        .query(`
          SELECT 
            p.ProductName,
            p.ProductWorth,
            ei.beginning_inventory,
            ei.ending_inventory,
            ei.sold
          FROM 
            EventInventory ei
          JOIN 
            Products p ON ei.product_id = p.ProductID
          WHERE 
            ei.event_id = @eventId
        `);

      console.log('Fetched inventory details:', inventoryResult.recordset);

      // Create a new PDF document
      const doc = new PDFDocument();
      const tempDirPath = path.join(__dirname, '../../temp');
      const tempFilePath = path.join(tempDirPath, `${uuidv4()}.pdf`);

      // Ensure the temp directory exists
      if (!fs.existsSync(tempDirPath)) {
        fs.mkdirSync(tempDirPath, { recursive: true });
        console.log(`Created temp directory: ${tempDirPath}`);
      }

      // Generate the PDF
      const writeStream = fs.createWriteStream(tempFilePath);
      doc.pipe(writeStream);
      console.log('Started writing to PDF document');

      doc.fontSize(20).text(`Event Report`, { align: 'center' });
      doc.fontSize(16).text(`Event: ${event.eventName}`);
      doc.text(`Date: ${new Date(event.startDateTime).toLocaleDateString()}`);
      doc.text(`Duration: ${event.duration_hours} hrs ${event.duration_minutes} min`);
      doc.text(`Campaign: ${event.campaign}`);
      doc.text(`Venue: ${event.venue}`);
      doc.text(`Address: ${event.address}`);
      doc.text(`Brand Ambassador: ${event.brandAmbassador}`);

      doc.moveDown();
      doc.fontSize(18).text(`Brand Ambassador Report`, { underline: true });

      // Add event report questions and answers
      const reportQuestions = [
        'sampled_flavors', 'price', 'consumers_sampled', 'consumers_engaged', 'total_attendees',
        'beatboxes_purchased', 'first_time_consumers', 'product_sampled_how', 'top_reason_bought',
        'top_reason_didnt_buy', 'qr_scans', 'table_location', 'swag', 'customer_feedback', 'other_feedback'
      ];

      reportQuestions.forEach(key => {
        if (event[key]) {
          doc.fontSize(14).text(`${key.replace(/_/g, ' ')}: ${event[key]}`);
        }
      });

      if (inventoryResult.recordset.length > 0) {
        doc.moveDown();
        doc.fontSize(18).text(`Inventory Report`, { underline: true });
      
        // Set column positions
        const startX = 72;
        const colWidths = {
          productName: 180,
          beginningInventory: 100,
          endingInventory: 100,
          sold: 100,
          total: 120,
        };
      
        // Create table header
        doc.fontSize(14)
          .text(`Product Name`, startX, doc.y)
          .text(`Beginning Inventory`, startX + colWidths.productName, doc.y)
          .text(`Ending Inventory`, startX + colWidths.productName + colWidths.beginningInventory, doc.y)
          .text(`# Sold`, startX + colWidths.productName + colWidths.beginningInventory + colWidths.endingInventory, doc.y)
          .text(`Total (with Product Worth)`, startX + colWidths.productName + colWidths.beginningInventory + colWidths.endingInventory + colWidths.sold, doc.y)
          .moveDown();
      
        // Add inventory data
        inventoryResult.recordset.forEach((item) => {
          const totalSold = String(item.sold * item.ProductWorth)
      
          doc.fontSize(12)
            .text(item.ProductName, startX, doc.y)
            .text(item.beginning_inventory, startX + colWidths.productName, doc.y)
            .text(item.ending_inventory, startX + colWidths.productName + colWidths.beginningInventory, doc.y)
            .text(item.sold, startX + colWidths.productName + colWidths.beginningInventory + colWidths.endingInventory, doc.y)
            .text(totalSold, startX + colWidths.productName + colWidths.beginningInventory + colWidths.endingInventory + colWidths.sold, doc.y)
            .moveDown();
        });
        console.log('Inventory data added to PDF');
      }

      // Fetch and add event photos from all ambassadors
      const photoResult = await pool.request()
        .input('eventId', sql.Int, eventId)
        .query(`
          SELECT 
            file_name,
            file_path
          FROM 
            EventPhotos
          WHERE 
            event_id = @eventId
        `);

      console.log('Fetched event photos:', photoResult.recordset);

      const uniquePhotos = new Set(photoResult.recordset.map(photo => photo.file_path));
      if (uniquePhotos.size > 0) {
        doc.addPage();
        doc.fontSize(18).text(`Event Photos`, { underline: true });

        let x = 72;
        let y = doc.y + 20;
        const imageHeight = 200;
        const imageWidth = 250;
        const margin = 20;

        for (const filePath of uniquePhotos) {
          const imagePath = path.join(tempDirPath, `${uuidv4()}${path.extname(filePath)}`);
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: filePath.split('/').pop()
          });

          console.log('Downloading image from S3:', filePath);

          const { Body } = await s3.send(command);
          await pipeline(Body as stream.Readable, fs.createWriteStream(imagePath));
          console.log('Downloaded image:', imagePath);

          if (x + imageWidth > doc.page.width - margin) {
            x = 72;
            y += imageHeight + margin;
            if (y + imageHeight > doc.page.height - margin) {
              doc.addPage();
              y = 72;
            }
          }

          doc.image(imagePath, x, y, { fit: [imageWidth, imageHeight], align: 'center' });
          x += imageWidth + margin;

          console.log('Added image to PDF:', imagePath);

          fs.unlinkSync(imagePath);
          console.log('Deleted temporary image file:', imagePath);
        }
      }

      // Close the document and make sure it's fully written
      doc.end();

      // Wait until the PDF is fully written before uploading
      writeStream.on('finish', async () => {
        console.log('PDF generation completed:', tempFilePath);

        // Upload to S3
        console.log('Uploading PDF to S3...');
        const pdfKey = `reports/${uuidv4()}.pdf`;
        const pdfContent = fs.readFileSync(tempFilePath);
        const uploadParams = {
          Bucket: process.env.AWS_S3_REPORT_BUCKET_NAME!,
          Key: pdfKey,
          Body: pdfContent,
          ContentType: 'application/pdf',
        };
        await s3.send(new PutObjectCommand(uploadParams));
        console.log('PDF uploaded to S3.');

        // Store the PDF information in the database
        const reportName = `${event.eventName.replace(/ /g, '_')}_${eventId}.pdf`;
        const s3Path = `https://${process.env.AWS_S3_REPORT_BUCKET_NAME}.s3.amazonaws.com/${pdfKey}`;
        if (transaction) {
          await transaction.request()
            .input('event_id', sql.Int, eventId)
            .input('report_name', sql.NVarChar, reportName)
            .input('s3_path', sql.NVarChar, s3Path)
            .query(`
              INSERT INTO EventReports (event_id, report_name, s3_path)
              VALUES (@event_id, @report_name, @s3_path)
            `);
  
          // Update the event to mark the report as submitted
          await transaction.request()
            .input('eventId', sql.Int, eventId)
            .query(`
              UPDATE Events
              SET report_submitted = 1
              WHERE event_id = @eventId
            `);
  
          // Update the personal report submission for the ambassador
          await transaction.request()
            .input('eventId', sql.Int, eventId)
            .input('baId', sql.Int, baId)
            .query(`
              UPDATE EventBrandAmbassadors
              SET personal_report_submitted = 1
              WHERE event_id = @eventId AND ba_id = @baId
            `);
  
          // Delete the temp file after uploading
          fs.unlinkSync(tempFilePath);
          console.log('Temporary PDF file deleted.');
  
          await transaction.commit();
          res.status(200).json({ message: 'Report successfully submitted, PDF generated, and event marked as complete.' });
        }
      });
    } else {
      res.status(400).json({ message: 'All sections must be completed before submitting the report.' });
    }
  } catch (error) {
    console.error('Error generating and submitting report:', error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error generating and submitting report.' });
  }
};





export const partialSubmit = async (req: Request, res: Response) => {
  const { eventId, baId, photosFilled, expensesFilled } = req.body;
  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Update the personal report submission for the ambassador
    await transaction.request()
      .input('eventId', sql.Int, eventId)
      .input('baId', sql.Int, baId)
      .query(`
        UPDATE EventBrandAmbassadors
        SET personal_report_submitted = 1
        WHERE event_id = @eventId AND ba_id = @baId
      `);

    // Perform any other partial submission-related tasks (e.g., storing photos or expenses separately)

    await transaction.commit();
    res.status(200).json({ message: 'Partial report successfully submitted.' });
  } catch (error) {
    console.error('Error in partial submission:', error);

    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error in partial submission.' });
  }
};


export const getCompletedReports = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        E.event_id,
        E.event_name,
        E.start_date_time,
        E.created_at AS report_date,
        U.name AS ba_name,
        V.name AS venue_name,
        C.name AS campaign_name,
        E.campaign_id, -- Adding campaign_id here
        T.name AS team_name,
        (
          SELECT 
            COUNT(*) 
          FROM 
            Receipts R 
          WHERE 
            R.event_id = E.event_id
        ) + 
        (
          SELECT 
            COUNT(*) 
          FROM 
            MileageReports MR 
          WHERE 
            MR.EventId = E.event_id
        ) + 
        (
          SELECT 
            COUNT(*) 
          FROM 
            OtherExpenses OE 
          WHERE 
            OE.EventId = E.event_id
        ) AS number_of_expenses,
        (
          SELECT 
            COUNT(*) 
          FROM 
            EventPhotos EP 
          WHERE 
            EP.event_id = E.event_id
        ) AS number_of_photos
      FROM 
        Events E
      INNER JOIN 
        EventBrandAmbassadors EBA ON E.event_id = EBA.event_id
      INNER JOIN 
        Users U ON EBA.ba_id = U.id
      INNER JOIN 
        Venues V ON E.venue_id = V.id
      INNER JOIN 
        Campaigns C ON E.campaign_id = C.id
      LEFT JOIN 
        Teams T ON E.team_id = T.id
      WHERE 
        E.paid = 1 AND E.is_deleted = 0
        AND (EBA.qa = 1 OR EBA.inventory = 1)
      ORDER BY 
        E.start_date_time DESC;
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching completed reports:', error);
    res.status(500).json({ message: 'Error fetching completed reports' });
  }
};


