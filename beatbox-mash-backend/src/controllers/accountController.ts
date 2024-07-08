// controllers/accountController.ts
import { Request, Response } from 'express';
import { poolPromise } from '../database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  '341841504141-b66a2b8ubf2aikoaoj64bvhr2sdh20i6.apps.googleusercontent.com', // ClientID
  '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', // Client Secret
  'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: '1//04WApiUxtczvHCgYIARAAGAQSNgF-L9IrYpjol50Q0ksIKppRCUfsmTLH9o0EjrGIaN1yvqn7ms75geo9a3AlCfsGOXhlRWuAjQ'
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
    const hash = await bcrypt.hash(token, 10);

    await pool.request()
      .input('email', email)
      .input('password_hash', hash)
      .input('role', role)
      .input('name', 'Temporary Name')  // Add a temporary name
      .input('wage', role === 'manager' ? 0 : null)  // Set default wage for managers
      .query(`
        INSERT INTO Users (email, password_hash, role, name, wage, created_at, updated_at)
        VALUES (@email, @password_hash, @role, @name, @wage, GETDATE(), GETDATE())
      `);

    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'matthewjamison56@gmail.com',
        clientId: '341841504141-b66a2b8ubf2aikoaoj64bvhr2sdh20i6.apps.googleusercontent.com',
        clientSecret: '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',
        refreshToken: '1//04WApiUxtczvHCgYIARAAGAQSNgF-L9IrYpjol50Q0ksIKppRCUfsmTLH9o0EjrGIaN1yvqn7ms75geo9a3AlCfsGOXhlRWuAjQ',
        accessToken: accessToken.token as string,
      },
    });

    const mailOptions = {
      to: email,
      from: 'matthewjamison56@gmail.com',
      subject: 'Account Creation',
      text: `You are receiving this because you (or someone else) have requested the creation of an account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://localhost:5173/set-password/${token}\n\n
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
    const tokenHash = bcrypt.hashSync(token, 10);
    const result = await pool.request()
      .input('password_hash', tokenHash)
      .query('SELECT * FROM Users WHERE password_hash = @password_hash');

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
