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
    const pool = await poolPromise;
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
          ei.product_id,
          ei.beginning_inventory,
          ei.ending_inventory,
          ei.sold,
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
      `);

    const event = result.recordset[0];

    // Create a new PDF document
    const doc = new PDFDocument();
    const dirPath = path.join(__dirname, '../../pdfs');
    const tempDirPath = path.join(__dirname, '../../temp');
    const filePath = path.join(dirPath, `${event.eventName.replace(/ /g, '_')}_${eventId}.pdf`);

    // Ensure the directories exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath, { recursive: true });
    }

    doc.pipe(fs.createWriteStream(filePath));

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
    if (event.product_id) {
      doc.moveDown();
      doc.fontSize(18).text(`Inventory Report`, { underline: true });
      doc.fontSize(14).text(`Product ID: ${event.product_id}`);
      doc.text(`Beginning Inventory: ${event.beginning_inventory}`);
      doc.text(`Ending Inventory: ${event.ending_inventory}`);
      doc.text(`Sold: ${event.sold}`);
    }

    // Add event photos
    const photos = result.recordset.filter(row => row.file_name && row.file_path);
    if (photos.length > 0) {
      doc.moveDown();
      doc.fontSize(18).text(`Event Photos`, { underline: true });
      for (const photo of photos) {
        const imagePath = path.join(tempDirPath, `${uuidv4()}${path.extname(photo.file_name)}`);
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: photo.file_path.split('/').pop()
        });

        const { Body } = await s3.send(command);
        await pipeline(Body as stream.Readable, fs.createWriteStream(imagePath));
        
        const imageHeight = 400;
        const imageWidth = 500;
        const margin = 50;
        const availablePageHeight = doc.page.height - doc.y - margin;
        if (imageHeight > availablePageHeight) {
          doc.addPage();
        }

        doc.image(imagePath, { fit: [imageWidth, imageHeight], align: 'center' });
        fs.unlinkSync(imagePath);
      }
    }

    doc.end();

    res.status(200).json({ message: 'PDF generated successfully', filePath: `/pdfs/${path.basename(filePath)}` });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};
