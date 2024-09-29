import { Request, Response } from 'express';
import { poolPromise } from '../database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { google } from 'googleapis';
import sql from 'mssql';
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

export const getAmbassadorsWithTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Users.id, 
        Users.name, 
        Users.email, 
        Users.address, 
        Users.phone_number, 
        Users.avatar_url, 
        COALESCE(
          (
            SELECT STRING_AGG(T.name, ', ')
            FROM (
              SELECT DISTINCT Teams.name
              FROM Teams
              INNER JOIN UserTeams ON Teams.id = UserTeams.team_id
              WHERE UserTeams.user_id = Users.id
            ) T
          ), 
          ''
        ) AS teams, 
        Users.wage, 
        Users.date_of_last_request,
        COALESCE(
          STRING_AGG(
            CONCAT(
              CAST(UserAvailability.start_datetime AS VARCHAR(33)), '|', 
              CAST(UserAvailability.end_datetime AS VARCHAR(33)), '|', 
              CAST(UserAvailability.all_day AS VARCHAR(1))
            ), 
            '||'
          ), 
          ''
        ) AS availability
      FROM 
        Users
      LEFT JOIN 
        UserAvailability ON Users.id = UserAvailability.user_id
      WHERE 
        Users.role = 'ambassador' AND Users.is_deleted = 0
      GROUP BY 
        Users.id, 
        Users.name, 
        Users.email, 
        Users.address, 
        Users.phone_number, 
        Users.avatar_url, 
        Users.wage, 
        Users.date_of_last_request
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching ambassadors with availability:', error);
    res.status(500).json({ message: 'Error fetching ambassadors with availability' });
  }
};


export const createAmbassadors = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { ambassadors, requiredDocs } = req.body;

    for (const ambassador of ambassadors) {
      const token = crypto.randomBytes(20).toString('hex');
      const tokenHash = await bcrypt.hash(token, 10);

      const requestUser = new sql.Request(transaction);

      const result = await requestUser
        .input('name', sql.NVarChar, `${ambassador.firstName} ${ambassador.lastName}`)
        .input('email', sql.NVarChar, ambassador.email)
        .input('role', sql.NVarChar, 'ambassador')
        .input('wage', sql.Decimal(10, 2), ambassador.wage)
        .input('password_hash', sql.NVarChar, tokenHash)
        .input('reset_token', sql.NVarChar, token)
        .query(`
          INSERT INTO Users (name, email, role, wage, password_hash, reset_token, date_of_last_request, avatar_url, phone_number, address, created_at, updated_at)
          OUTPUT INSERTED.id
          VALUES (@name, @email, @role, @wage, @password_hash, @reset_token, NULL, NULL, NULL, NULL, GETDATE(), GETDATE())
        `);

      const userId = result.recordset[0].id;

      // Assign teams to the user
      for (const teamName of ambassador.teams) {
        const requestTeam = new sql.Request(transaction);

        const teamResult = await requestTeam
          .input('teamName', sql.NVarChar, teamName)
          .query(`
            SELECT id FROM Teams WHERE name = @teamName
          `);

        if (teamResult.recordset.length > 0) {
          const teamId = teamResult.recordset[0].id;

          const requestUserTeams = new sql.Request(transaction);

          await requestUserTeams
            .input('userId', sql.Int, userId)
            .input('teamId', sql.Int, teamId)
            .query(`
              INSERT INTO UserTeams (user_id, team_id, joined_at)
              VALUES (@userId, @teamId, GETDATE())
            `);
        } else {
          console.warn(`Team not found: ${teamName}`);
        }
      }

      // Assign trainings to the user
      for (const trainingId of ambassador.trainingIds) {
        const requestUserTrainings = new sql.Request(transaction);

        await requestUserTrainings
          .input('userId', sql.Int, userId)
          .input('trainingMaterialId', sql.Int, trainingId)
          .query(`
            INSERT INTO UserTrainings (user_id, training_material_id, is_completed, assigned_at)
            VALUES (@userId, @trainingMaterialId, 0, GETDATE())
          `);
      }

      // Assign required documents to the user
      for (const docType of requiredDocs) {
        const requestUserDocs = new sql.Request(transaction);

        await requestUserDocs
          .input('userId', sql.Int, userId)
          .input('documentType', sql.NVarChar, docType)
          .query(`
            INSERT INTO UserRequiredDocuments (user_id, document_type, is_uploaded)
            VALUES (@userId, @documentType, 0)
          `);
      }

      // Send account creation email
      await sendAccountCreationEmail(ambassador.email, token);
    }

    await transaction.commit();
    res.status(200).json({ message: 'Ambassadors created successfully' });
  } catch (error) {
    console.error('Error creating ambassadors:', error);
    res.status(500).json({ message: 'Error creating ambassadors' });
  }
};

const sendAccountCreationEmail = async (email: string, token: string) => {
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
      https://beatbox-mash.vercel.app/set-password/${token}\n\n
      If you did not request this, please ignore this email.\n`
  };

  await transporter.sendMail(mailOptions);
};

export const deleteAmbassador = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const { id } = req.body;

    // Soft delete by setting is_deleted to 1
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Users SET is_deleted = 1 WHERE id = @id');

    res.status(200).json({ message: 'Ambassador deleted (soft delete) successfully' });
  } catch (error) {
    console.error('Error deleting (soft delete) ambassador:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const updateAmbassadorTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { id, teams } = req.body;

    // Delete existing teams for the ambassador
    const requestDelete = new sql.Request(transaction);

    await requestDelete
      .input('userId', sql.Int, id)
      .query(`
        DELETE FROM UserTeams WHERE user_id = @userId
      `);

    // Insert new teams for the ambassador
    for (const teamName of teams) {
      const requestTeam = new sql.Request(transaction);

      // Fetch the team ID based on the team name
      const teamResult = await requestTeam
        .input('teamName', sql.VarChar, teamName)
        .query(`
          SELECT id FROM Teams WHERE name = @teamName
        `);

      if (teamResult.recordset.length > 0) {
        const teamId = teamResult.recordset[0].id;

        // Create a new request for inserting into UserTeams
        const requestUserTeams = new sql.Request(transaction);

        await requestUserTeams
          .input('userId', sql.Int, id)
          .input('teamId', sql.Int, teamId)
          .query(`
            INSERT INTO UserTeams (user_id, team_id, joined_at)
            VALUES (@userId, @teamId, GETDATE())
          `);
      } else {
        console.warn(`Team not found: ${teamName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Ambassador teams updated successfully' });
  } catch (error) {
    console.error('Error updating ambassador teams:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const editAmbassadorWage = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { id, wage } = req.body;

    console.log('Updating wage for ambassador ID:', id);
    console.log('New wage:', wage);

    // Create a new request for updating the wage
    const requestUpdateWage = new sql.Request(transaction);

    await requestUpdateWage
      .input('userId', sql.Int, id)
      .input('wage', sql.Decimal(10, 2), wage)
      .query(`
        UPDATE Users 
        SET wage = @wage, updated_at = GETDATE()
        WHERE id = @userId
      `);

    await transaction.commit();
    res.status(200).json({ message: 'Ambassador wage updated successfully' });
  } catch (error) {
    console.error('Error updating ambassador wage:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};