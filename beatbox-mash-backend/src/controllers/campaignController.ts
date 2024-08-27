import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    console.log('Connecting to the database...');
    const pool = await poolPromise;

    console.log('Executing SQL query...');
    const result = await pool.request().query(`
      SELECT 
        Campaigns.*, 
        COALESCE(STRING_AGG(Teams.name, ', '), '') AS teams
      FROM 
        Campaigns
      LEFT JOIN 
        CampaignTeams ON Campaigns.id = CampaignTeams.campaign_id
      LEFT JOIN 
        Teams ON CampaignTeams.team_id = Teams.id
      WHERE 
        Campaigns.is_deleted = 0
      GROUP BY 
        Campaigns.id, Campaigns.name, Campaigns.owners, Campaigns.report_template, 
        Campaigns.pre_event_instructions, Campaigns.first_ba_inventory, Campaigns.first_ba_post_event, 
        Campaigns.subsequent_ba_inventory, Campaigns.subsequent_ba_post_event, Campaigns.ba_check_in_out, 
        Campaigns.photo_check_in, Campaigns.photo_check_out, Campaigns.show_check_photos_in_report, 
        Campaigns.created_at, Campaigns.updated_at, Campaigns.is_deleted
    `);

    console.log('SQL query executed successfully.');

    const campaigns = result.recordset.map(campaign => ({
      ...campaign,
      owners: campaign.owners ? campaign.owners.split(',') : []
    }));

    res.json(campaigns.length > 0 ? campaigns : []);
  } catch (err) {
    const error = err as Error;
    console.error('Error occurred in getCampaigns:', error.message);
    res.status(500).send(error.message);
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const {
      name, owners, report_template, pre_event_instructions,
      first_ba_inventory, first_ba_post_event, subsequent_ba_inventory, subsequent_ba_post_event,
      ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report, teams, products
    } = req.body;

    console.log('Creating campaign:', req.body); // Log input data

    const ownersString = owners.join(',');

    const requestCampaign = new sql.Request(transaction);

    const result = await requestCampaign
      .input('name', sql.NVarChar, name)
      .input('owners', sql.NVarChar, ownersString || null)
      .input('report_template', sql.NVarChar, report_template || null)
      .input('pre_event_instructions', sql.NVarChar, pre_event_instructions || null)
      .input('first_ba_inventory', sql.Bit, first_ba_inventory || 0)
      .input('first_ba_post_event', sql.Bit, first_ba_post_event || 0)
      .input('subsequent_ba_inventory', sql.Bit, subsequent_ba_inventory || 0)
      .input('subsequent_ba_post_event', sql.Bit, subsequent_ba_post_event || 0)
      .input('ba_check_in_out', sql.Bit, ba_check_in_out || 0)
      .input('photo_check_in', sql.NVarChar, photo_check_in || 'disabled')
      .input('photo_check_out', sql.NVarChar, photo_check_out || 'disabled')
      .input('show_check_photos_in_report', sql.Bit, show_check_photos_in_report || 0)
      .query(`
        INSERT INTO Campaigns (name, owners, report_template, pre_event_instructions,
          first_ba_inventory, first_ba_post_event, subsequent_ba_inventory, subsequent_ba_post_event,
          ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report,
          created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @owners, @report_template, @pre_event_instructions,
          @first_ba_inventory, @first_ba_post_event, @subsequent_ba_inventory, @subsequent_ba_post_event,
          @ba_check_in_out, @photo_check_in, @photo_check_out, @show_check_photos_in_report,
          GETDATE(), GETDATE())
      `);

    const campaignId = result.recordset[0].id;

    console.log('Inserted campaign with ID:', campaignId); // Log inserted ID

    // Insert teams
    for (const teamName of teams) {
      const requestTeam = new sql.Request(transaction);

      const teamResult = await requestTeam
        .input('teamName', sql.NVarChar, teamName)
        .query(`
          SELECT id FROM Teams WHERE name = @teamName
        `);

      if (teamResult.recordset.length > 0) {
        const teamId = teamResult.recordset[0].id;

        const requestCampaignTeams = new sql.Request(transaction);

        await requestCampaignTeams
          .input('campaignId', sql.Int, campaignId)
          .input('teamId', sql.Int, teamId)
          .query(`
            INSERT INTO CampaignTeams (campaign_id, team_id)
            VALUES (@campaignId, @teamId)
          `);
      } else {
        console.warn(`Team not found: ${teamName}`);
      }
    }

    // Insert products
    for (const product of products) {
      const { ProductName } = product;
      const requestProduct = new sql.Request(transaction);

      const productResult = await requestProduct
        .input('productName', sql.NVarChar, ProductName)
        .query(`
          SELECT ProductID FROM Products WHERE ProductName = @productName
        `);

      if (productResult.recordset.length > 0) {
        const productId = productResult.recordset[0].ProductID;

        const requestCampaignProducts = new sql.Request(transaction);

        await requestCampaignProducts
          .input('campaignId', sql.Int, campaignId)
          .input('productId', sql.Int, productId)
          .query(`
            INSERT INTO CampaignProducts (campaign_id, product_id)
            VALUES (@campaignId, @productId)
          `);
      } else {
        console.warn(`Product not found: ${ProductName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Campaign created successfully', campaignId });
  } catch (error) {
    console.error('Error creating campaign:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};


export const updateCampaign = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    await transaction.begin();

    const {
      id, name, owners, report_template, pre_event_instructions,
      first_ba_inventory, first_ba_post_event, subsequent_ba_inventory, subsequent_ba_post_event,
      ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report, teams, products
    } = req.body;

    if (!id) {
      throw new Error('Campaign ID is missing.');
    }

    const ownersString = owners.join(',');

    const requestCampaign = new sql.Request(transaction);

    await requestCampaign
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('owners', sql.NVarChar, ownersString || null)
      .input('report_template', sql.NVarChar, report_template || null)
      .input('pre_event_instructions', sql.NVarChar, pre_event_instructions || null)
      .input('first_ba_inventory', sql.Bit, first_ba_inventory || 0)
      .input('first_ba_post_event', sql.Bit, first_ba_post_event || 0)
      .input('subsequent_ba_inventory', sql.Bit, subsequent_ba_inventory || 0)
      .input('subsequent_ba_post_event', sql.Bit, subsequent_ba_post_event || 0)
      .input('ba_check_in_out', sql.Bit, ba_check_in_out || 0)
      .input('photo_check_in', sql.NVarChar, photo_check_in || 'disabled')
      .input('photo_check_out', sql.NVarChar, photo_check_out || 'disabled')
      .input('show_check_photos_in_report', sql.Bit, show_check_photos_in_report || 0)
      .query(`
        UPDATE Campaigns SET
          name = @name,
          owners = @owners,
          report_template = @report_template,
          pre_event_instructions = @pre_event_instructions,
          first_ba_inventory = @first_ba_inventory,
          first_ba_post_event = @first_ba_post_event,
          subsequent_ba_inventory = @subsequent_ba_inventory,
          subsequent_ba_post_event = @subsequent_ba_post_event,
          ba_check_in_out = @ba_check_in_out,
          photo_check_in = @photo_check_in,
          photo_check_out = @photo_check_out,
          show_check_photos_in_report = @show_check_photos_in_report,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Update teams
    const deleteTeamsRequest = new sql.Request(transaction);
    await deleteTeamsRequest
      .input('campaignId', sql.Int, id)
      .query(`DELETE FROM CampaignTeams WHERE campaign_id = @campaignId`);

    for (const teamName of teams) {
      const teamResult = await new sql.Request(transaction)
        .input('teamName', sql.NVarChar, teamName)
        .query(`SELECT id FROM Teams WHERE name = @teamName`);

      if (teamResult.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('campaignId', sql.Int, id)
          .input('teamId', sql.Int, teamResult.recordset[0].id)
          .query(`INSERT INTO CampaignTeams (campaign_id, team_id) VALUES (@campaignId, @teamId)`);
      } else {
        throw new Error(`Team not found: ${teamName}`);
      }
    }

    // Update products
    const deleteProductsRequest = new sql.Request(transaction);
    await deleteProductsRequest
      .input('campaignId', sql.Int, id)
      .query(`DELETE FROM CampaignProducts WHERE campaign_id = @campaignId`);

    for (const product of products) {
      const productResult = await new sql.Request(transaction)
        .input('productName', sql.NVarChar, product.ProductName)
        .query(`SELECT ProductID FROM Products WHERE ProductName = @productName`);

      if (productResult.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('campaignId', sql.Int, id)
          .input('productId', sql.Int, productResult.recordset[0].ProductID)
          .query(`INSERT INTO CampaignProducts (campaign_id, product_id) VALUES (@campaignId, @productId)`);
      } else {
        throw new Error(`Product not found: ${product.ProductName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Campaign updated successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const { id } = req.body;

    // Delete the campaign record
    await request
      .input('id', sql.Int, id)
      .query('UPDATE Campaigns SET is_deleted = 1 WHERE id = @id');

    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const updateCampaignTeams = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const { id, teams } = req.body;

    console.log('Updating campaign teams:', req.body); // Log input data

    // Delete existing teams for the campaign
    await new sql.Request(transaction)
      .input('campaignId', sql.Int, id)
      .query(`
        DELETE FROM CampaignTeams WHERE campaign_id = @campaignId
      `);

    // Insert new teams for the campaign
    for (const teamName of teams) {
      const requestTeam = new sql.Request(transaction);

      const teamResult = await requestTeam
        .input('teamName', sql.NVarChar, teamName)
        .query(`
          SELECT id FROM Teams WHERE name = @teamName
        `);

      if (teamResult.recordset.length > 0) {
        const teamId = teamResult.recordset[0].id;

        const requestCampaignTeams = new sql.Request(transaction);

        await requestCampaignTeams
          .input('campaignId', sql.Int, id)
          .input('teamId', sql.Int, teamId)
          .query(`
            INSERT INTO CampaignTeams (campaign_id, team_id)
            VALUES (@campaignId, @teamId)
          `);
      } else {
        console.warn(`Team not found: ${teamName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Campaign teams updated successfully' });
  } catch (error) {
    console.error('Error updating campaign teams:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export const getCampaignByName = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query(`
        SELECT 
          Campaigns.*, 
          COALESCE(STRING_AGG(Teams.name, ', '), '') AS teams
        FROM 
          Campaigns
        LEFT JOIN 
          CampaignTeams ON Campaigns.id = CampaignTeams.campaign_id
        LEFT JOIN 
          Teams ON CampaignTeams.team_id = Teams.id
        WHERE 
          Campaigns.name = @name AND Campaigns.is_deleted = 0
        GROUP BY 
          Campaigns.id, Campaigns.name, Campaigns.owners, Campaigns.report_template, 
          Campaigns.pre_event_instructions, Campaigns.first_ba_inventory, Campaigns.first_ba_post_event, 
          Campaigns.subsequent_ba_inventory, Campaigns.subsequent_ba_post_event, Campaigns.ba_check_in_out, 
          Campaigns.photo_check_in, Campaigns.photo_check_out, Campaigns.show_check_photos_in_report, 
          Campaigns.created_at, Campaigns.updated_at
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    const error = err as Error;
    res.status(500).send(error.message);
  }
};

export const getCampaignById = async (req: Request, res: Response) => {
  try {
      const pool = await poolPromise;
      const campaignId = req.params.id;

      // SQL query to fetch campaign details along with associated teams and products
      const result = await pool.request()
          .input('campaignId', sql.Int, campaignId)
          .query(`
              SELECT 
                  c.*,
                  COALESCE(STRING_AGG(t.name, ', '), '') AS teams,
                  p.ProductID,
                  p.ProductName,
                  p.Barcode,
                  p.MSRP,
                  p.ProductGroup
              FROM 
                  Campaigns c
              LEFT JOIN 
                  CampaignTeams ct ON c.id = ct.campaign_id
              LEFT JOIN 
                  Teams t ON ct.team_id = t.id
              LEFT JOIN 
                  CampaignProducts cp ON c.id = cp.campaign_id
              LEFT JOIN 
                  Products p ON cp.product_id = p.ProductID
              WHERE 
                  c.id = @campaignId AND c.is_deleted = 0
              GROUP BY 
                  c.id, c.name, c.owners, c.report_template, 
                  c.pre_event_instructions, c.first_ba_inventory, 
                  c.first_ba_post_event, c.subsequent_ba_inventory, 
                  c.subsequent_ba_post_event, c.ba_check_in_out, 
                  c.photo_check_in, c.photo_check_out, 
                  c.show_check_photos_in_report, c.created_at, 
                  c.updated_at, c.is_deleted,
                  p.ProductID, p.ProductName, p.Barcode, p.MSRP, p.ProductGroup
          `);

      // Check if the campaign was found
      if (result.recordset.length === 0) {
          return res.status(404).json({ message: 'Campaign not found' });
      }

      const campaign = result.recordset.reduce((acc, row) => {
          if (!acc) {
              acc = {
                  id: row.id,
                  name: row.name,
                  owners: row.owners ? row.owners.split(',').map((owner: string) => owner.trim()) : [],
                  report_template: row.report_template,
                  pre_event_instructions: row.pre_event_instructions,
                  first_ba_inventory: row.first_ba_inventory,
                  first_ba_post_event: row.first_ba_post_event,
                  subsequent_ba_inventory: row.subsequent_ba_inventory,
                  subsequent_ba_post_event: row.subsequent_ba_post_event,
                  ba_check_in_out: row.ba_check_in_out,
                  photo_check_in: row.photo_check_in,
                  photo_check_out: row.photo_check_out,
                  show_check_photos_in_report: row.show_check_photos_in_report,
                  teams: row.teams ? row.teams.split(', ').map((team: string) => team.trim()) : [],
                  products: []
              };
          }

          if (row.ProductID) {
              acc.products.push({
                  ProductID: row.ProductID,
                  ProductName: row.ProductName,
                  Barcode: row.Barcode,
                  MSRP: row.MSRP,
                  ProductGroup: row.ProductGroup,
              });
          }

          return acc;
      }, null);

      res.json(campaign);
  } catch (err) {
      console.error('Error in getCampaignById:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};
