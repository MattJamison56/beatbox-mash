import { Request, Response } from 'express';
import { poolPromise } from '../database';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (err) {
    const error = err as Error;
    res.status(500).send(error.message);
  }
};

export const getUsersWithTeams = async (req: Request, res: Response) => {
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
      GROUP BY 
        Users.id, Users.name, Users.email, Users.address, Users.password_hash, Users.role, Users.phone_number, Users.wage, Users.date_of_last_request, Users.avatar_url, Users.created_at, Users.updated_at
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching users with teams:', error);
    res.status(500).json({ message: 'Error fetching users with teams' });
  }
};