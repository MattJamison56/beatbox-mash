import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users WHERE is_deleted = 0');
    res.json(result.recordset);
  } catch (err) {
    const error = err as Error;
    res.status(500).send(error.message);
  }
};

export const getAmbassadorsWithTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Users.*, 
        COALESCE(STRING_AGG(Teams.name, ', '), '') AS teams
      FROM 
        Users
      LEFT JOIN 
        UserTeams ON Users.id = UserTeams.user_id
      LEFT JOIN 
        Teams ON UserTeams.team_id = Teams.id
      WHERE 
        Users.role = 'ambassador' AND Users.is_deleted = 0
      GROUP BY 
        Users.id, Users.name, Users.email, Users.address, Users.password_hash, 
        Users.role, Users.phone_number, Users.wage, Users.date_of_last_request, 
        Users.avatar_url, Users.created_at, Users.updated_at, Users.reset_token
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching ambassadors with teams:', error);
    res.status(500).json({ message: 'Error fetching ambassadors with teams' });
  }
};

export const getManagersWithTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Users.*,
        (SELECT STRING_AGG(Teams.name, ', ') 
         FROM UserTeams 
         JOIN Teams ON UserTeams.team_id = Teams.id 
         WHERE UserTeams.user_id = Users.id
        ) AS teams
      FROM 
        Users
      WHERE 
        Users.role = 'manager' AND Users.is_deleted = 0
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching managers with teams:', error);
    res.status(500).json({ message: 'Error fetching managers with teams' });
  }
};

export const updateManagerTeams = async (req: Request, res: Response) => {
  const { id, teams } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('user_id', id)
      .query('DELETE FROM UserTeams WHERE user_id = @user_id');

    for (const team of teams) {
      await pool.request()
        .input('user_id', id)
        .input('team_name', team)
        .query(`
          INSERT INTO UserTeams (user_id, team_id)
          SELECT @user_id, id FROM Teams WHERE name = @team_name
        `);
    }

    res.status(200).json({ message: 'Teams updated successfully' });
  } catch (error) {
    console.error('Error updating teams:', error);
    res.status(500).json({ message: 'Error updating teams' });
  }
};

export const deleteManager = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const pool = await poolPromise;

    // Soft delete the manager by setting is_deleted = 1
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Users SET is_deleted = 1, updated_at = GETDATE() WHERE id = @id');

    res.status(200).json({ message: 'Manager soft deleted successfully' });
  } catch (error) {
    console.error('Error soft deleting manager:', error);
    res.status(500).json({ message: 'Error soft deleting manager' });
  }
};

// Fetch Availability for a Specific User
export const getUserAvailability = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT availability 
        FROM dbo.Users 
        WHERE id = @user_id AND is_deleted = 0
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const availability = result.recordset[0].availability;
    
    if (!availability) {
      return res.status(200).json([]); // No availability set
    }
    
    const availabilityData = JSON.parse(availability);
    res.status(200).json(availabilityData);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
};

// Update Availability for a Specific User
export const updateUserAvailability = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const availabilityData: {
    start_datetime: string; // ISO string
    end_datetime: string;   // ISO string
    all_day: boolean;
  }[] = req.body;

  try {
    const pool = await poolPromise;
    
    const availabilityJson = JSON.stringify(availabilityData);
    
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('availability', sql.NVarChar(sql.MAX), availabilityJson)
      .query(`
        UPDATE dbo.Users
        SET availability = @availability, updated_at = SYSUTCDATETIME()
        WHERE id = @user_id AND is_deleted = 0
      `);
    
    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Error updating availability' });
  }
};
