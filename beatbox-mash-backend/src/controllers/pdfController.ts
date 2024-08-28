import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';
import util from 'util';
import s3 from '../awsConfig';

const pipeline = util.promisify(stream.pipeline);

export const generateReportPDF = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    console.log('Starting PDF generation for event ID:', eventId);
    
    const pool = await poolPromise;
    console.log('Connected to the database');

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
          EventInventory ei ON e.event_id = ei.event_id
        LEFT JOIN 
          EventPhotos ep ON e.event_id = ep.event_id
        WHERE 
          e.event_id = @eventId
          AND e.is_deleted = 0 AND eba.is_deleted = 0 AND u.is_deleted = 0 AND v.is_deleted = 0 AND c.is_deleted = 0
      `);

    const event = result.recordset[0];
    console.log('Event data fetched:', event);

    const inventoryResult = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query(`
        SELECT 
          p.ProductName,
          ei.beginning_inventory,
          ei.ending_inventory,
          ei.sold
        FROM 
          EventInventory ei
        JOIN 
          Products p ON ei.product_id = p.ProductID
        WHERE 
          ei.event_id = @eventId
          AND ei.is_deleted = 0 AND p.is_deleted = 0
      `);
    console.log('Inventory data fetched:', inventoryResult.recordset);

    // Create a new PDF document
    const doc = new PDFDocument();
    const dirPath = path.join(__dirname, '../../pdfs');
    const tempDirPath = path.join(__dirname, '../../temp');
    const filePath = path.join(dirPath, `${event.eventName.replace(/ /g, '_')}_${eventId}.pdf`);

    // Ensure the directories exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('PDF directory created:', dirPath);
    }
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath, { recursive: true });
      console.log('Temp directory created:', tempDirPath);
    }

    doc.pipe(fs.createWriteStream(filePath));
    console.log('PDF creation started:', filePath);

    // Add content to the PDF
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

    // Add event inventory
    if (inventoryResult.recordset.length > 0) {
      doc.moveDown();
      doc.fontSize(18).text(`Inventory Report`, { underline: true });

      // Create table header
      doc.fontSize(14).text(`Product Name`, 72, doc.y);
      doc.text(`Beginning Inventory`, 180, doc.y);
      doc.text(`Ending Inventory`, 320, doc.y);
      doc.text(`# Sold`, 440, doc.y);
      doc.moveDown();

      // Add inventory data
      inventoryResult.recordset.forEach((item, index) => {
        doc.fontSize(12).text(item.ProductName, 72, doc.y);
        doc.text(item.beginning_inventory, 180, doc.y);
        doc.text(item.ending_inventory, 320, doc.y);
        doc.text(item.sold, 440, doc.y);
        doc.moveDown();
      });
      console.log('Inventory data added to PDF');
    }

    // Add event photos
    const photos = result.recordset.filter(row => row.file_name && row.file_path);
    const uniquePhotos = new Set(photos.map(photo => photo.file_path));
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

        fs.unlinkSync(imagePath);
        console.log('Image added to PDF and deleted:', imagePath);
      }
    }

    doc.end();
    console.log('PDF generation completed:', filePath);

    res.status(200).json({ message: 'PDF generated successfully', filePath: `/pdfs/${path.basename(filePath)}` });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};


export const getEventPdf = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query(`
        SELECT s3_path 
        FROM EventReports 
        WHERE event_id = @eventId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'PDF not found for the event.' });
    }

    const pdfUrl = result.recordset[0].s3_path;
    res.status(200).json({ pdfUrl });
  } catch (error) {
    console.error('Error fetching PDF URL:', error);
    res.status(500).json({ message: 'Error fetching PDF URL.' });
  }
};
