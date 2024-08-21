import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getVenues = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Venues WHERE is_deleted = 0');
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

    const { venue } = req.body;

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
    const { id } = req.body;

    // Soft delete the venue by setting is_deleted = 1
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Venues SET is_deleted = 1, updated_at = GETDATE() WHERE id = @id');

    res.status(200).json({ message: 'Venue soft deleted successfully' });
  } catch (error) {
    console.error('Error soft deleting venue:', error);
    res.status(500).json({ message: 'Error soft deleting venue' });
  }
};


export const getVenuesWithTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Venues.id,
        Venues.name,
        Venues.address,
        Venues.region,
        Venues.comment,
        Venues.contact1_name,
        Venues.contact1_phone,
        Venues.contact2_name,
        Venues.contact2_phone,
        Venues.last_time_visited,
        Venues.created_at,
        Venues.updated_at,
        COALESCE(STRING_AGG(Teams.name, ', '), '') AS teams
      FROM 
        Venues
      LEFT JOIN 
        VenueTeams ON Venues.id = VenueTeams.venue_id
      LEFT JOIN 
        Teams ON VenueTeams.team_id = Teams.id
      WHERE 
        Venues.is_deleted = 0  -- Only include venues that are not deleted
      GROUP BY 
        Venues.id,
        Venues.name,
        Venues.address,
        Venues.region,
        Venues.comment,
        Venues.contact1_name,
        Venues.contact1_phone,
        Venues.contact2_name,
        Venues.contact2_phone,
        Venues.last_time_visited,
        Venues.created_at,
        Venues.updated_at
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching venues with teams:', error);
    res.status(500).json({ message: 'Error fetching venues with teams' });
  }
};

export const updateVenueTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { id, teams } = req.body;

    console.log('Updating teams for venue ID:', id);
    console.log('New teams:', teams);

    // Delete existing teams for the venue
    const requestDelete = new sql.Request(transaction);

    await requestDelete
      .input('venueId', sql.Int, id)
      .query(`
        DELETE FROM VenueTeams WHERE venue_id = @venueId
      `);

    // Insert new teams for the venue
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

        // Create a new request for inserting into VenueTeams
        const requestVenueTeams = new sql.Request(transaction);

        await requestVenueTeams
          .input('venueId', sql.Int, id)
          .input('teamId', sql.Int, teamId)
          .query(`
            INSERT INTO VenueTeams (venue_id, team_id)
            VALUES (@venueId, @teamId)
          `);
      } else {
        console.warn(`Team not found: ${teamName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Venue teams updated successfully' });
  } catch (error) {
    console.error('Error updating venue teams:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { venue } = req.body;
    const {
      id,
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

    console.log('Updating venue ID:', id);
    console.log('New venue data:', venue);

    const request = new sql.Request(transaction);

    await request
      .input('id', sql.Int, id)
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
        UPDATE Venues
        SET
          name = @name,
          address = @address,
          region = @region,
          comment = @comment,
          contact1_name = @contact1_name,
          contact1_phone = @contact1_phone,
          contact2_name = @contact2_name,
          contact2_phone = @contact2_phone,
          last_time_visited = @last_time_visited,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Delete existing teams for the venue
    const requestDeleteTeams = new sql.Request(transaction);
    await requestDeleteTeams
      .input('venueId', sql.Int, id)
      .query(`
        DELETE FROM VenueTeams WHERE venue_id = @venueId
      `);

    // Insert new teams for the venue
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

        // Create a new request for inserting into VenueTeams
        const requestVenueTeams = new sql.Request(transaction);

        await requestVenueTeams
          .input('venueId', sql.Int, id)
          .input('teamId', sql.Int, teamId)
          .query(`
            INSERT INTO VenueTeams (venue_id, team_id)
            VALUES (@venueId, @teamId)
          `);
      } else {
        console.warn(`Team not found: ${teamName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Venue updated successfully' });
  } catch (error) {
    console.error('Error updating venue:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};