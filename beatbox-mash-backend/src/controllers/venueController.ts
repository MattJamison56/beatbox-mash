import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getVenues = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Venues');
    res.json(result.recordset);
  } catch (err) {
    const error = err as Error;
    res.status(500).send(error.message);
  }
};

export const createVenue = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { venues } = req.body;

    for (const venue of venues) {
      const {
        name,
        address,
        region,
        comment,
        contact1_name,
        contact1_phone,
        contact2_name,
        contact2_phone,
        last_time_visited,
        teams
      } = venue;

      console.log('Creating venue:', venue); // Log input data

      const requestVenue = new sql.Request(transaction);

      const result = await requestVenue
        .input('name', sql.VarChar, name)
        .input('address', sql.VarChar, address)
        .input('region', sql.VarChar, region || null)
        .input('comment', sql.VarChar, comment || null)
        .input('contact1_name', sql.VarChar, contact1_name || null)
        .input('contact1_phone', sql.VarChar, contact1_phone || null)
        .input('contact2_name', sql.VarChar, contact2_name || null)
        .input('contact2_phone', sql.VarChar, contact2_phone || null)
        .input('last_time_visited', sql.DateTime, last_time_visited || null)
        .query(`
          INSERT INTO Venues (name, address, region, comment, contact1_name, contact1_phone, contact2_name, contact2_phone, last_time_visited, created_at, updated_at)
          OUTPUT INSERTED.id
          VALUES (@name, @address, @region, @comment, @contact1_name, @contact1_phone, @contact2_name, @contact2_phone, @last_time_visited, GETDATE(), GETDATE())
        `);

      const venueId = result.recordset[0].id;

      for (const teamName of teams) {
        const requestTeam = new sql.Request(transaction);

        const teamResult = await requestTeam
          .input('teamName', sql.VarChar, teamName)
          .query(`
            SELECT id FROM Teams WHERE name = @teamName
          `);

        if (teamResult.recordset.length > 0) {
          const teamId = teamResult.recordset[0].id;

          const requestVenueTeams = new sql.Request(transaction);

          await requestVenueTeams
            .input('venueId', sql.Int, venueId)
            .input('teamId', sql.Int, teamId)
            .query(`
              INSERT INTO VenueTeams (venue_id, team_id)
              VALUES (@venueId, @teamId)
            `);
        } else {
          console.warn(`Team not found: ${teamName}`);
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Venue(s) created successfully' });
  } catch (error) {
    console.error('Error creating venue(s):', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const { id } = req.body;

    // Delete related records in VenueTeams first
    const requestDeleteTeams = new sql.Request(pool);
    await requestDeleteTeams
      .input('venueId', sql.Int, id)
      .query(`
        DELETE FROM VenueTeams WHERE venue_id = @venueId
      `);

    // Delete the venue record
    await request
      .input('id', sql.Int, id)
      .query('DELETE FROM Venues WHERE id = @id');

    res.status(200).json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};