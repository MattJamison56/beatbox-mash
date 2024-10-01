// controllers/trainingController.ts
import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import s3 from '../awsConfig';

// Create a new folder
export const createFolder = async (req: Request, res: Response) => {
  const { name, parentFolderId } = req.body;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    await request
      .input('name', sql.NVarChar, name)
      .input('parentFolderId', sql.Int, parentFolderId || null)
      .query(`
        INSERT INTO TrainingFolders (name, parent_folder_id)
        VALUES (@name, @parentFolderId)
      `);

    res.status(201).json({ message: 'Folder created successfully' });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Error creating folder' });
  }
};

// Get folder structure
export const getFolders = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    const result = await request.query(`
      SELECT * FROM TrainingFolders
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Error fetching folders' });
  }
};

// Upload training material
export const uploadTrainingMaterial = async (req: Request, res: Response) => {
  const { folderId, title, description, type } = req.body;
  let files = req.files?.file;

  console.log('Received upload request:', { folderId, title, description, type });

  if (!files) {
    console.error('No files were uploaded.');
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  if (!Array.isArray(files)) {
    files = [files]; // Normalize to an array
  }

  const file = files[0];

  if (!process.env.AWS_S3_TRAINING_BUCKET_NAME) {
    console.error('AWS S3 bucket name is not defined.');
    return res.status(500).json({ message: 'AWS S3 bucket name is not defined.' });
  }

  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = pool.transaction();

    await transaction.begin();
    const request = transaction.request();

    //@ts-ignore
    if (!file || !file.name) {
      throw new Error('Invalid file object');
    }
    
     //@ts-ignore
    console.log('Processing file:', file.name);
    
     //@ts-ignore
    const fileName = uuidv4() + path.extname(file.name); // Generate a unique file name
    const filePath = path.join('/tmp', fileName); // Temporary directory to store file locally

    console.log('Writing file to temporary path:', filePath);
     //@ts-ignore
    fs.writeFileSync(filePath, file.data); // Save file to temporary location

    const fileContent = fs.readFileSync(filePath); // Read file content from local storage

    console.log('Preparing to upload to S3:', {
      bucket: process.env.AWS_S3_TRAINING_BUCKET_NAME,
      key: `training-materials/${fileName}`,
    });

    // Prepare S3 upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_S3_TRAINING_BUCKET_NAME!,
      Key: `training-materials/${fileName}`, // Store in the 'training-materials' folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3.send(uploadCommand); // Upload the file to S3

    console.log('File uploaded to S3 successfully.');

    // Remove the file from the local system after successful upload
    fs.unlinkSync(filePath);
    console.log('Temporary file deleted:', filePath);

    // Construct the S3 file URL
    const fileUrl = `https://${process.env.AWS_S3_TRAINING_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/training-materials/${fileName}`;

    console.log('Inserting training material into database.');

    // Insert the new training material into the database
    await request
      .input('folderId', sql.Int, folderId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('type', sql.NVarChar, type)
      .input('fileUrl', sql.NVarChar, fileUrl)
      .query(`
        INSERT INTO TrainingMaterials (folder_id, title, description, type, file_url)
        VALUES (@folderId, @title, @description, @type, @fileUrl)
      `);

    await transaction.commit();
    console.log('Training material inserted into database successfully.');

    res.status(201).json({ message: 'Training material uploaded successfully', fileUrl });
  } catch (error) {
    console.error('Error uploading training material:', error);

    if (transaction) {
      await transaction.rollback();
      console.log('Transaction rolled back due to error.');
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Get materials in a folder
export const getMaterials = async (req: Request, res: Response) => {
  const { folderId } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    const result = await request
      .input('folderId', sql.Int, folderId)
      .query(`
        SELECT * FROM TrainingMaterials WHERE folder_id = @folderId
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Error fetching materials' });
  }
};

export const getMyTrainings = async (req: Request, res: Response) => {
  const { ba_id } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ba_id', sql.Int, ba_id)
      .query(`
        SELECT 
        tm.id AS materialId,
        tm.title AS title,
        tm.description AS description,
        tm.type AS type,
        tm.file_url AS fileUrl,
        tm.video_duration AS videoDuration,
        tf.id AS folderId,
        tf.name AS folderName,
        ut.is_completed AS isCompleted,
        ut.assigned_at AS assignedAt,
        ut.completed_at AS completedAt
      FROM 
        UserTrainings ut
      JOIN 
        TrainingMaterials tm ON ut.training_material_id = tm.id
      JOIN
        TrainingFolders tf ON tm.folder_id = tf.id
      WHERE 
        ut.user_id = @ba_id

      `);

    const trainings = result.recordset;

    console.log('Fetched training materials:', result.recordset);

    // Group the materials by folder
    const groupedTrainings = trainings.reduce((acc: any, curr: any) => {
      const folderId = curr.folderId;
      if (!acc[folderId]) {
        acc[folderId] = {
          folderId: curr.folderId,
          folderName: curr.folderName,
          materials: []
        };
      }
      acc[folderId].materials.push({
        materialId: curr.materialId,
        title: curr.title,
        description: curr.description,
        type: curr.type,
        fileUrl: curr.fileUrl,
        videoDuration: curr.videoDuration,
        isCompleted: curr.isCompleted,
        assignedAt: curr.assignedAt,
        completedAt: curr.completedAt
      });
      return acc;
    }, {});

    const groupedTrainingsArray = Object.values(groupedTrainings);

    console.log(groupedTrainingsArray);
  
    res.status(200).json(groupedTrainingsArray);
  } catch (error) {
    console.error('Error fetching assigned trainings:', error);
    res.status(500).json({ message: 'Error fetching assigned trainings' });
  }
};

export const markTrainingAsCompleted = async (req: Request, res: Response) => {
  const { userId, trainingMaterialId } = req.body;

  if (!userId || !trainingMaterialId) {
    return res.status(400).json({ message: 'User ID and Training Material ID are required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', userId)
      .input('trainingMaterialId', trainingMaterialId)
      .query(`
        UPDATE UserTrainings
        SET is_completed = 1, completed_at = GETDATE()
        WHERE user_id = @userId AND training_material_id = @trainingMaterialId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Training material not found or already completed' });
    }

    res.status(200).json({ message: 'Training marked as completed successfully' });
  } catch (error) {
    console.error('Error marking training as completed:', error);
    res.status(500).json({ message: 'Error marking training as completed' });
  }
};