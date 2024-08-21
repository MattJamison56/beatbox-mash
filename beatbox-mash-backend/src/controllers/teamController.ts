import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const { name } = req.body;

    const request = new sql.Request(pool);

    await request
      .input('name', sql.VarChar, name)
      .query(`
        INSERT INTO Teams (name, created_at, updated_at)
        VALUES (@name, GETDATE(), GETDATE())
      `);

    res.status(201).json({ message: 'Team created successfully' });
  } catch (error) {
    console.error('Error creating team:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Teams WHERE is_deleted = 0');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
};

// Need to put on frontend
export const deleteTeam = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Teams SET is_deleted = 1, updated_at = GETDATE() WHERE id = @id');

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Error deleting team' });
  }
};