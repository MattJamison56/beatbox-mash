import { Request, Response } from 'express';
import { poolPromise } from '../database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { google } from 'googleapis';
import dotenv from 'dotenv';

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

