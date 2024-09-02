/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, Box, Button } from '@mui/material';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './getCompletedPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface CompletedReportsPageProps {
    onCampaignClick: (campaign: any) => void;
  }

const CompletedReportsPage: React.FC<CompletedReportsPageProps> = ({ onCampaignClick }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [reports, setReports] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${apiUrl}/reports/completed`);
      const data = await response.json();
      console.log(data);
      setReports(data);
    } catch (error) {
      console.error('Error fetching completed reports:', error);
    }
  };

  const fetchPdf = async (eventId: number) => {
    try {
      const response = await fetch(`${apiUrl}/pdf/getpdf/${eventId}`);
      const data = await response.json();
      setPdfUrl(data.pdfUrl);
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching PDF:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCampaignClick = async (campaignId: number) => {
    try {
      const response = await fetch(`${apiUrl}/campaigns/${campaignId}`);
      const campaignData = await response.json();
      onCampaignClick(campaignData);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    }
  };

  const handleEventClick = (eventId: number) => {
    fetchPdf(eventId);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setPdfUrl(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Completed Reports</h1>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Report Date</TableCell>
              <TableCell>BA Name</TableCell>
              <TableCell>Venue Name</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Team</TableCell>
              <TableCell># of Expenses</TableCell>
              <TableCell># of Photos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span
                    className="clickable"
                    onClick={() => handleEventClick(report.event_id)}>
                    {report.event_name}
                  </span>
                </TableCell>
                <TableCell>{new Date(report.start_date_time).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                <TableCell>{report.ba_name}</TableCell>
                <TableCell>{report.venue_name}</TableCell>
                <TableCell>
                  <span
                    className="clickable"
                    onClick={() => handleCampaignClick(report.campaign_id)}>
                    {report.campaign_name}
                  </span>
                </TableCell>
                <TableCell>{report.region}</TableCell>
                <TableCell>{report.team_name || 'N/A'}</TableCell>
                <TableCell>{report.number_of_expenses}</TableCell>
                <TableCell>{report.number_of_photos}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          onClick={handleCloseModal}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
        >
          <div
            className="modalContent"
            style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {pdfUrl ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js">
                <div style={{ height: '80vh', width: '900px', overflow: 'hidden' }}>
                  <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
                </div>
              </Worker>
            ) : (
              <p>Loading...</p>
            )}
            <Box style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Button variant="contained" onClick={handleCloseModal}>
                Close
              </Button>
            </Box>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default CompletedReportsPage;
