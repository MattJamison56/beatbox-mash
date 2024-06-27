import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const createAmbassadors = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { ambassadors } = req.body;

    console.log('Creating ambassadors:', ambassadors); // Log input data

    for (const ambassador of ambassadors) {
      console.log('Processing ambassador:', ambassador); // Log each ambassador

      // Create a new request for inserting user
      const requestUser = new sql.Request(transaction);

      const result = await requestUser
        .input('name', sql.VarChar, `${ambassador.firstName} ${ambassador.lastName}`)
        .input('email', sql.VarChar, ambassador.email)
        .input('role', sql.NVarChar, 'ambassador')
        .input('wage', sql.Decimal(10, 2), ambassador.wage)
        .query(`
          INSERT INTO Users (name, email, role, wage, date_of_last_request, avatar_url, phone_number, address, password_hash, created_at, updated_at)
          OUTPUT INSERTED.id
          VALUES (@name, @email, @role, @wage, NULL, NULL, NULL, NULL, NULL, GETDATE(), GETDATE())
        `);

      const userId = result.recordset[0].id;

      for (const teamName of ambassador.teams) {
        // Create a new request for each team query
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
    }

    await transaction.commit();
    res.status(200).json({ message: 'Ambassadors created successfully' });
  } catch (error) {
    console.error('Error creating ambassadors:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const deleteAmbassador = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const { id } = req.body;
    
    const requestDelete = new sql.Request(pool);
    await requestDelete
      .input('userId', sql.Int, id)
      .query(`
        DELETE FROM UserTeams WHERE user_id = @userId
      `);

    await request
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE id = @id');

    res.status(200).json({ message: 'Ambassador deleted successfully' });
  } catch (error) {
    console.error('Error deleting ambassador:', error);
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

    console.log('Updating teams for ambassador ID:', id);
    console.log('New teams:', teams);

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