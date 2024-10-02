/* eslint-disable react-hooks/exhaustive-deps */
// components/materialList/materialList.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Box,
  IconButton,
} from '@mui/material';
import VideoPlayer from '../videoPlayer/videoPlayer';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import * as pdfjsLib from 'pdfjs-dist';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

interface Material {
  id: number;
  title: string;
  description: string;
  type: string;
  file_url: string;
}

interface MaterialListProps {
  materials: Material[];
  onMaterialSelect: (materialId: number) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ materials, onMaterialSelect }) => {
  const [openViewer, setOpenViewer] = useState<boolean>(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(true); // Track if it's a video or PDF
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<{ [key: number]: string }>({}); // Cache PDF previews

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleViewClick = (material: Material) => {
    setMediaUrl(material.file_url);
    setIsVideo(material.type === 'video');
    setOpenViewer(true);
  };

  const handleEditQuestionsClick = (material: Material) => {
    onMaterialSelect(material.id);
  };

  // Function to generate a PDF preview
  const generatePdfPreview = async (material: Material) => {
    try {
      console.log(`Generating PDF preview for material ID: ${material.id}`);

      const pdf = await pdfjsLib.getDocument(material.file_url).promise;
      console.log(`PDF loaded successfully for material ID: ${material.id}`);

      const page = await pdf.getPage(1);
      console.log(`First page of PDF loaded for material ID: ${material.id}`);

      const scale = 0.2; // Adjust scale to create a thumbnail
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d') as CanvasRenderingContext2D;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      console.log(`PDF rendered for material ID: ${material.id}`);

      const previewUrl = canvas.toDataURL();
      console.log(`Generated preview URL for material ID: ${material.id}`);

      setPdfPreviewUrls((prev) => ({
        ...prev,
        [material.id]: previewUrl,
      }));
    } catch (error) {
      console.error(`Error generating PDF preview for material ID: ${material.id}`, error);
    }
  };

  useEffect(() => {
    materials
      .filter((material) => material.type === 'document')
      .forEach((material) => {
        if (!pdfPreviewUrls[material.id]) {
          console.log(`Requesting PDF preview for material ID: ${material.id}`);
          generatePdfPreview(material);
        }
      });
  }, [materials]);

  return (
    <>
      <List>
        {materials.map((material) => (
          <ListItem key={material.id}>
            <Box display="flex" alignItems="center" width="100%">
              {material.type === 'video' ? (
                <video
                  src={material.file_url}
                  preload="metadata"
                  width={120}
                  style={{ marginRight: '16px' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={pdfPreviewUrls[material.id] || ''}
                  alt={`PDF Preview for material ${material.id}`}
                  width={120}
                  style={{ marginRight: '16px' }}
                  onError={() =>
                    console.log(`Failed to load preview for material ID: ${material.id}`)
                  }
                />
              )}
              <ListItemText
                primary={material.title}
                secondary={material.description}
                style={{ color: 'black' }}
              />
              {/* View Button */}
              <IconButton onClick={() => handleViewClick(material)}>
                <VisibilityIcon />
              </IconButton>
              {/* Add/Edit Questions Button */}
              <IconButton onClick={() => handleEditQuestionsClick(material)}>
                <EditIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Viewer Dialog */}
      <Dialog 
        open={openViewer} 
        onClose={() => setOpenViewer(false)} 
        maxWidth="lg" 
        fullWidth={!isVideo}  // Conditionally apply fullWidth only if it's not a video (i.e., it's a PDF)
      >
        <DialogContent sx={{ padding: 0 }}>
          {isVideo ? (
            <Box
              sx={{
                margin: '0 auto', // Center horizontally
                padding: 1, // Optional padding
              }}
            >
              <VideoPlayer
                videoUrl={mediaUrl}
                onComplete={() => {
                  // Handle completion, e.g., close viewer or mark as complete
                  setOpenViewer(false);
                }}
              />
            </Box>
          ) : (
            <Box sx={{ height: '90vh', width: '100%' }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js">
                <Viewer fileUrl={mediaUrl} plugins={[defaultLayoutPluginInstance]} />
              </Worker>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaterialList;
