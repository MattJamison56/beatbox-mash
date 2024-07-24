import { Request, Response } from 'express';
import { poolPromise } from '../database';
import sql from 'mssql';

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
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
      GROUP BY 
        Campaigns.id, Campaigns.name, Campaigns.owners, Campaigns.report_template, 
        Campaigns.pre_event_instructions, Campaigns.first_ba_inventory, Campaigns.first_ba_post_event, 
        Campaigns.subsequent_ba_inventory, Campaigns.subsequent_ba_post_event, Campaigns.ba_can_schedule, 
        Campaigns.ba_edit_event_name, Campaigns.ba_change_venue, Campaigns.ba_reschedule, 
        Campaigns.ba_check_in_out, Campaigns.photo_check_in, Campaigns.photo_check_out, 
        Campaigns.show_check_photos_in_report, Campaigns.set_time_duration_presets, 
        Campaigns.allow_ba_to_schedule, Campaigns.override_wage, Campaigns.exclude_expenses_from_report, 
        Campaigns.hide_ba_contact_info, Campaigns.created_at, Campaigns.updated_at
    `);

    const campaigns = result.recordset.map(campaign => ({
      ...campaign,
      owners: campaign.owners ? campaign.owners.split(',') : []
    }));

    res.json(campaigns);
  } catch (err) {
    const error = err as Error;
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
      ba_can_schedule, ba_edit_event_name, ba_change_venue, ba_reschedule,
      ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report,
      set_time_duration_presets, allow_ba_to_schedule, override_wage,
      exclude_expenses_from_report, hide_ba_contact_info, teams, products
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
      .input('ba_can_schedule', sql.Bit, ba_can_schedule || 0)
      .input('ba_edit_event_name', sql.Bit, ba_edit_event_name || 0)
      .input('ba_change_venue', sql.Bit, ba_change_venue || 0)
      .input('ba_reschedule', sql.Bit, ba_reschedule || 0)
      .input('ba_check_in_out', sql.Bit, ba_check_in_out || 0)
      .input('photo_check_in', sql.NVarChar, photo_check_in || 'disabled')
      .input('photo_check_out', sql.NVarChar, photo_check_out || 'disabled')
      .input('show_check_photos_in_report', sql.Bit, show_check_photos_in_report || 0)
      .input('set_time_duration_presets', sql.Bit, set_time_duration_presets || 0)
      .input('allow_ba_to_schedule', sql.Bit, allow_ba_to_schedule || 0)
      .input('override_wage', sql.Bit, override_wage || 0)
      .input('exclude_expenses_from_report', sql.Bit, exclude_expenses_from_report || 0)
      .input('hide_ba_contact_info', sql.Bit, hide_ba_contact_info || 0)
      .query(`
        INSERT INTO Campaigns (name, owners, report_template, pre_event_instructions,
          first_ba_inventory, first_ba_post_event, subsequent_ba_inventory, subsequent_ba_post_event,
          ba_can_schedule, ba_edit_event_name, ba_change_venue, ba_reschedule,
          ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report,
          set_time_duration_presets, allow_ba_to_schedule, override_wage,
          exclude_expenses_from_report, hide_ba_contact_info, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @owners, @report_template, @pre_event_instructions,
          @first_ba_inventory, @first_ba_post_event, @subsequent_ba_inventory, @subsequent_ba_post_event,
          @ba_can_schedule, @ba_edit_event_name, @ba_change_venue, @ba_reschedule,
          @ba_check_in_out, @photo_check_in, @photo_check_out, @show_check_photos_in_report,
          @set_time_duration_presets, @allow_ba_to_schedule, @override_wage,
          @exclude_expenses_from_report, @hide_ba_contact_info, GETDATE(), GETDATE())
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
    for (const productName of products) {
      const requestProduct = new sql.Request(transaction);

      const productResult = await requestProduct
        .input('productName', sql.NVarChar, productName)
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
        console.warn(`Product not found: ${productName}`);
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
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const {
      id, name, owners, report_template, pre_event_instructions,
      first_ba_inventory, first_ba_post_event, subsequent_ba_inventory, subsequent_ba_post_event,
      ba_can_schedule, ba_edit_event_name, ba_change_venue, ba_reschedule,
      ba_check_in_out, photo_check_in, photo_check_out, show_check_photos_in_report,
      set_time_duration_presets, allow_ba_to_schedule, override_wage,
      exclude_expenses_from_report, hide_ba_contact_info, teams, products
    } = req.body;

    console.log('Updating campaign:', req.body); // Log input data

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
      .input('ba_can_schedule', sql.Bit, ba_can_schedule || 0)
      .input('ba_edit_event_name', sql.Bit, ba_edit_event_name || 0)
      .input('ba_change_venue', sql.Bit, ba_change_venue || 0)
      .input('ba_reschedule', sql.Bit, ba_reschedule || 0)
      .input('ba_check_in_out', sql.Bit, ba_check_in_out || 0)
      .input('photo_check_in', sql.NVarChar, photo_check_in || 'disabled')
      .input('photo_check_out', sql.NVarChar, photo_check_out || 'disabled')
      .input('show_check_photos_in_report', sql.Bit, show_check_photos_in_report || 0)
      .input('set_time_duration_presets', sql.Bit, set_time_duration_presets || 0)
      .input('allow_ba_to_schedule', sql.Bit, allow_ba_to_schedule || 0)
      .input('override_wage', sql.Bit, override_wage || 0)
      .input('exclude_expenses_from_report', sql.Bit, exclude_expenses_from_report || 0)
      .input('hide_ba_contact_info', sql.Bit, hide_ba_contact_info || 0)
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
          ba_can_schedule = @ba_can_schedule,
          ba_edit_event_name = @ba_edit_event_name,
          ba_change_venue = @ba_change_venue,
          ba_reschedule = @ba_reschedule,
          ba_check_in_out = @ba_check_in_out,
          photo_check_in = @photo_check_in,
          photo_check_out = @photo_check_out,
          show_check_photos_in_report = @show_check_photos_in_report,
          set_time_duration_presets = @set_time_duration_presets,
          allow_ba_to_schedule = @allow_ba_to_schedule,
          override_wage = @override_wage,
          exclude_expenses_from_report = @exclude_expenses_from_report,
          hide_ba_contact_info = @hide_ba_contact_info,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Update teams
    await new sql.Request(transaction)
      .input('campaignId', sql.Int, id)
      .query(`
        DELETE FROM CampaignTeams WHERE campaign_id = @campaignId
      `);

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

    // Update products
    await new sql.Request(transaction)
      .input('campaignId', sql.Int, id)
      .query(`
        DELETE FROM CampaignProducts WHERE campaign_id = @campaignId
      `);

    for (const productName of products) {
      const requestProduct = new sql.Request(transaction);

      const productResult = await requestProduct
        .input('productName', sql.NVarChar, productName)
        .query(`
          SELECT ProductID FROM Products WHERE ProductName = @productName
        `);

      if (productResult.recordset.length > 0) {
        const productId = productResult.recordset[0].ProductID;

        const requestCampaignProducts = new sql.Request(transaction);

        await requestCampaignProducts
          .input('campaignId', sql.Int, id)
          .input('productId', sql.Int, productId)
          .query(`
            INSERT INTO CampaignProducts (campaign_id, product_id)
            VALUES (@campaignId, @productId)
          `);
      } else {
        console.warn(`Product not found: ${productName}`);
      }
    }

    await transaction.commit();
    res.status(200).json({ message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Error updating campaign:', error);
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};


export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const { id } = req.body;

    // Delete related records in CampaignTeams first
    const requestDeleteTeams = new sql.Request(pool);
    await requestDeleteTeams
      .input('campaignId', sql.Int, id)
      .query(`
        DELETE FROM CampaignTeams WHERE campaign_id = @campaignId
      `);

    // Delete the campaign record
    await request
      .input('id', sql.Int, id)
      .query('DELETE FROM Campaigns WHERE id = @id');

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
          Campaigns.name = @name
        GROUP BY 
          Campaigns.id, Campaigns.name, Campaigns.owners, Campaigns.report_template, 
          Campaigns.pre_event_instructions, Campaigns.first_ba_inventory, Campaigns.first_ba_post_event, 
          Campaigns.subsequent_ba_inventory, Campaigns.subsequent_ba_post_event, Campaigns.ba_can_schedule, 
          Campaigns.ba_edit_event_name, Campaigns.ba_change_venue, Campaigns.ba_reschedule, 
          Campaigns.ba_check_in_out, Campaigns.photo_check_in, Campaigns.photo_check_out, 
          Campaigns.show_check_photos_in_report, Campaigns.set_time_duration_presets, 
          Campaigns.allow_ba_to_schedule, Campaigns.override_wage, Campaigns.exclude_expenses_from_report, 
          Campaigns.hide_ba_contact_info, Campaigns.created_at, Campaigns.updated_at
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