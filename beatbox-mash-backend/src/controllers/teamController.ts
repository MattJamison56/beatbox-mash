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
    const result = await pool.request().query('SELECT * FROM Teams');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
};
