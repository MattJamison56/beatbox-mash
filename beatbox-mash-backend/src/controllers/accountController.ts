import { Request, Response } from 'express';
import { poolPromise } from '../database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { google } from 'googleapis';
import dotenv from 'dotenv';

import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';
import util from 'util';
import s3 from '../awsConfig';

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

export const sendAccountCreationEmail = async (req: Request, res: Response) => {
  const { email, role } = req.body;

  try {
    const pool = await poolPromise;
    const userExists = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await pool.request()
      .input('email', email)
      .input('password_hash', tokenHash)
      .input('reset_token', token) 
      .input('role', role)
      .input('name', 'Temporary Name')  // Add a temporary name
      .input('wage', role === 'manager' ? 0 : null)  // Set default wage for managers
      .query(`
        INSERT INTO Users (email, password_hash, reset_token, role, name, wage, created_at, updated_at)
        VALUES (@email, @password_hash, @reset_token, @role, @name, @wage, GETDATE(), GETDATE())
      `);

    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token as string,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Account Creation',
      text: `You are receiving this because you (or someone else) have requested the creation of an account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        https://beatbox-mash.vercel.app//set-password/${token}\n\n
        If you did not request this, please ignore this email.\n`
    };

    transporter.sendMail(mailOptions, (err: any) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.status(200).json({ message: 'Email sent successfully' });
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error sending account creation email:', err.message);
    res.status(500).json({ message: 'Error sending account creation email', error: err.message });
  }
};

export const setPassword = async (req: Request, res: Response) => {
  const { token, password, name } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('reset_token', token)
      .query('SELECT * FROM Users WHERE reset_token = @reset_token');

    const user = result.recordset[0];

    if (!user) {
      console.error('Invalid token');
      return res.status(400).json({ message: 'Invalid token' });
    }

    const newHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('id', user.id)
      .input('password_hash', newHash)
      .input('name', name)  // Update the user's name
      .query('UPDATE Users SET password_hash = @password_hash, name = @name WHERE id = @id');

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error setting password:', err.message);
    res.status(500).json({ message: 'Error setting password', error: err.message });
  }
};

export const saveProfileInfo = async (req: Request, res: Response) => {
  const { id, date_of_birth, height_ft, height_in, shirt_size, hair_color, gender, primary_language, secondary_language, address } = req.body;

  try {
    console.log("In backend");
    console.log({ id, date_of_birth, height_ft, height_in, shirt_size, hair_color, gender, primary_language, secondary_language, address });

    const pool = await poolPromise;
    await pool.request()
      .input('id', id)
      .input('date_of_birth', date_of_birth)
      .input('height_ft', height_ft)
      .input('height_in', height_in)
      .input('shirt_size', shirt_size)
      .input('hair_color', hair_color)
      .input('gender', gender)
      .input('primary_language', primary_language)
      .input('secondary_language', secondary_language)
      .input('address', address)
      .query(`
        UPDATE Users
        SET date_of_birth = @date_of_birth, 
            height_ft = @height_ft, 
            height_in = @height_in, 
            shirt_size = @shirt_size, 
            hair_color = @hair_color, 
            gender = @gender,
            primary_language = @primary_language, 
            secondary_language = @secondary_language, 
            address = @address
        WHERE id = @id
      `);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const uploadUserAvatar = async (req: Request, res: Response) => {
  const { userId } = req.body;
  let files = req.files?.files;

  if (!files) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  if (!Array.isArray(files)) {
    files = [files]; // Normalize to an array
  }

  let file = files[0];

  if (!process.env.AWS_S3_AVATAR_BUCKET_NAME) {
    return res.status(500).json({ message: 'AWS S3 bucket name is not defined.' });
  }

  let transaction: sql.Transaction | undefined;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Fetch the current avatar URL from the database
    const request = new sql.Request(transaction);
    const result = await request
      .input('userId', sql.Int, userId)
      .query('SELECT avatar_url FROM Users WHERE id = @userId');
      
    const currentAvatarUrl = result.recordset[0]?.avatar_url;

    // If there's an existing avatar, delete it from S3
    if (currentAvatarUrl) {
      const key = currentAvatarUrl.split('/').pop(); // Extract the file name from the URL

      if (key) {
        const deleteParams = {
          Bucket: process.env.AWS_S3_AVATAR_BUCKET_NAME!,
          Key: `avatars/${key}`, // Make sure the key matches the folder path in S3
        };

        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3.send(deleteCommand); // Delete the current avatar from S3
      }
    }
    
    //@ts-ignore
    if (!file || !file.name) {
      throw new Error('Invalid file object');
    }

    // Ensure /tmp directory exists
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    //@ts-ignore
    const fileName = uuidv4() + path.extname(file.name); // Generate a unique file name
    const filePath = path.join(tmpDir, fileName); // Save file to created tmp folder
    
    //@ts-ignore
    fs.writeFileSync(filePath, file.data); // Save file to temporary location

    const fileContent = fs.readFileSync(filePath); // Read file content from local storage

    // Prepare S3 upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_S3_AVATAR_BUCKET_NAME!,
      Key: `avatars/${fileName}`, // Store in the 'avatars' folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3.send(uploadCommand); // Upload the new file to S3

    // Remove the file from the local system after successful upload
    fs.unlinkSync(filePath);

    // Construct the S3 file URL
    const avatarUrl = `https://${process.env.AWS_S3_AVATAR_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/avatars/${fileName}`;

    // Insert the new avatar URL into the database
    await request
      .input('avatarUrl', sql.NVarChar, avatarUrl)
      .query(`
        UPDATE Users 
        SET avatar_url = @avatarUrl
        WHERE id = @userId
      `);

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Avatar uploaded successfully', avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);

    // Rollback the transaction if there's an error
    if (transaction) {
      await transaction.rollback();
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};