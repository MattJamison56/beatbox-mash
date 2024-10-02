/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  CircularProgress,
  Link, // Import Link from MUI for clickable links
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import MaterialList from '../../components/ambassadorMaterialList/ambassadorMaterialList';

const apiUrl = import.meta.env.VITE_API_URL;

type Document = {
  documentType: string;
  isUploaded: boolean;
};

type TrainingMaterial = {
  materialId: number;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  isCompleted: boolean;
};

type TrainingFolder = {
  folderId: number;
  folderName: string;
  materials: TrainingMaterial[];
};

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trainings, setTrainings] = useState<TrainingFolder[]>([]);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const ba_id = localStorage.getItem('ba_id');

  useEffect(() => {
    fetchDocuments();
    fetchTrainings();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${apiUrl}/docs/${ba_id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/training/${ba_id}`);
      setTrainings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue);
  };

  // Modify to allow re-upload even if the document is already uploaded
  const handleDocumentUpload = async (documentType: string) => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png'; // Adjust acceptable file types if necessary
      fileInput.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const formData = new FormData();
          formData.append('userId', ba_id!);
          formData.append('documentType', documentType);
          formData.append('file', file);
  
          // Send the file to the backend
          await axios.post(`${apiUrl}/upload-doc`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          // Refresh the documents list after upload
          fetchDocuments();  // <-- Trigger refetch
        }
      };
      fileInput.click();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  // Pass this callback to MaterialList so that it can refetch data after completing training
  const handleTrainingCompleted = () => {
    fetchTrainings(); // Refetch trainings after material is marked as completed
  };

  // Maps document types to user-friendly names and instructions
  const getDocumentInstructions = (documentType: string): string | JSX.Element => {
    switch (documentType) {
      case 'alcohol_certification':
        return (
          <>
            Please add your current un-expired alcohol certification. Don't have one yet? Here's one way:{' '}
            <Link href="https://www.gettips.com/" target="_blank" rel="noopener noreferrer">
              Get Alcohol Certification
            </Link>
          </>
        );
      case 'drivers_license':
        return "Please upload a copy of the front of your driver's license.";
      case 'w9':
        return 'Please upload your completed W9 for payroll (you can find a blank W9 form online).';
      default:
        return '';
    }
  };

  const getDocumentDisplayName = (documentType: string): string => {
    switch (documentType) {
      case 'alcohol_certification':
        return 'Alcohol Certification';
      case 'drivers_license':
        return 'Drivers License';
      case 'w9':
        return 'W9';
      default:
        return documentType;
    }
  };

  return (
    <div style={{ color: 'black' }}>
      <Typography variant="h4" gutterBottom>
        Documents & Trainings
      </Typography>

      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Files to Review" />
        <Tab label="Training Materials" />
      </Tabs>

      {tabIndex === 0 && (
        <Box mt={2}>
          <Typography variant="h5" gutterBottom>
            These Documents Are Still Required
          </Typography>
          <List>
            {documents.map((doc, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={getDocumentDisplayName(doc.documentType)}
                  secondary={getDocumentInstructions(doc.documentType)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="upload"
                    onClick={() => handleDocumentUpload(doc.documentType)}
                  >
                    {doc.isUploaded ? (
                      <CheckCircleIcon color="primary" />
                    ) : (
                      <UploadIcon />
                    )}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {tabIndex === 1 && (
        <Box mt={2}>
          {loading ? (
            <CircularProgress />
          ) : trainings.length === 0 ? (
            <Typography>No trainings assigned.</Typography>
          ) : (
            trainings.map((folder) => {
              const allMaterialsCompleted = folder.materials.every(
                (material) => material.isCompleted
              );

              return (
                <Box key={folder.folderId} mb={4}>
                  <Typography variant="h5" gutterBottom>
                    {folder.folderName}{' '}
                    {allMaterialsCompleted && (
                      <CheckCircleIcon color="primary" />
                    )}
                  </Typography>
                  <MaterialList
                    materials={folder.materials}
                    userId={ba_id!}
                    onTrainingCompleted={handleTrainingCompleted} 
                  />
                </Box>
              );
            })
          )}
        </Box>
      )}
    </div>
  );
};

export default Documents;
