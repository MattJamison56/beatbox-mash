/* eslint-disable react-hooks/exhaustive-deps */
// MaterialList.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Box,
  Button,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VideoPlayer from '../videoPlayer/videoPlayer';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const apiUrl = import.meta.env.VITE_API_URL;

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Material {
  materialId: number;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  isCompleted: boolean;
}

interface MaterialListProps {
  materials: Material[];
  userId: string;
}

const MaterialList: React.FC<MaterialListProps> = ({
  materials: initialMaterials,
  userId,
}) => {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [openViewer, setOpenViewer] = useState<boolean>(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<{
    [key: number]: string;
  }>({});

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleStartClick = (material: Material) => {
    setCurrentMaterial(material);
    setOpenViewer(true);
  };

  const handleCloseViewer = () => {
    setOpenViewer(false);
    setCurrentMaterial(null);
  };

  const handleMaterialCompleted = async () => {
    if (currentMaterial) {
      try {
        await axios.post(`${apiUrl}/training/complete`, {
          userId: userId,
          trainingMaterialId: currentMaterial.materialId,
        });

        // Update the isCompleted status locally
        setMaterials((prevMaterials) =>
          prevMaterials.map((material) =>
            material.materialId === currentMaterial.materialId
              ? { ...material, isCompleted: true }
              : material
          )
        );

        // Close the viewer
        handleCloseViewer();
      } catch (error) {
        console.error('Error marking training as completed:', error);
      }
    }
  };

  // Function to generate a PDF preview
  const generatePdfPreview = async (material: Material) => {
    try {
      const pdf = await pdfjsLib.getDocument(material.fileUrl).promise;
    
      const page = await pdf.getPage(1);
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
  
      // Make sure to use the render() function properly and explicitly handle the Promise
      await new Promise<void>((resolve, reject) => {
        const renderTask = page.render(renderContext);
        renderTask.onRenderContinue = () => resolve(); // Resolve the promise when rendering is complete
        renderTask.promise.then(resolve).catch(reject);
      });
  
      const previewUrl = canvas.toDataURL();
  
      setPdfPreviewUrls((prev) => ({
        ...prev,
        [material.materialId]: previewUrl,
      }));
    } catch (error) {
      console.error(`Error generating PDF preview for material ID: ${material.materialId}`, error);
    }
  };
  
  

  useEffect(() => {
    materials
      .filter((material) => material.type === 'document')
      .forEach((material) => {
        if (!pdfPreviewUrls[material.materialId]) {
          generatePdfPreview(material);
        }
      });
  }, [materials]);

  return (
    <>
      <List>
        {materials.map((material) => (
          <ListItem key={material.materialId}>
            <Box display="flex" alignItems="center" width="100%">
              {material.type === 'video' ? (
                <video
                  src={material.fileUrl}
                  preload="metadata"
                  width={120}
                  style={{ marginRight: '16px' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={pdfPreviewUrls[material.materialId] || ''}
                  alt={`PDF Preview for material ${material.materialId}`}
                  width={120}
                  style={{ marginRight: '16px' }}
                  onError={() =>
                    console.log(
                      `Failed to load preview for material ID: ${material.materialId}`
                    )
                  }
                />
              )}
              <ListItemText
                primary={material.title}
                secondary={material.description}
                style={{ color: 'black' }}
              />
              <ListItemSecondaryAction>
                {material.isCompleted ? (
                  <IconButton onClick={() => handleStartClick(material)}>
                    <CheckCircleIcon color="primary" />
                  </IconButton>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleStartClick(material)}
                  >
                    Start
                  </Button>
                )}
              </ListItemSecondaryAction>
            </Box>
          </ListItem>
        ))}
      </List>

      {currentMaterial && (
        <Dialog
          open={openViewer}
          onClose={handleCloseViewer}
          maxWidth="lg"
          fullWidth
          fullScreen
        >
          <DialogTitle>
            {currentMaterial.title}
            <IconButton
              aria-label="close"
              onClick={handleCloseViewer}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{ padding: 0 }}>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ padding: '16px' }}
            >
              If you leave this page, the training will reset.
            </Typography>
            {currentMaterial.type === 'video' ? (
              <VideoPlayer
                videoUrl={currentMaterial.fileUrl}
                onComplete={handleMaterialCompleted}
              />
            ) : (
              <div style={{ height: '90vh', width: '100%', position: 'relative' }}>
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js">
                  <Viewer
                    fileUrl={currentMaterial.fileUrl}
                    plugins={[defaultLayoutPluginInstance]}
                  />
                </Worker>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleMaterialCompleted}
                  style={{ position: 'absolute', bottom: '16px', right: '16px' }}
                >
                  Mark as Completed
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MaterialList;
