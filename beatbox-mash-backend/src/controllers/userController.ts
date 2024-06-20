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