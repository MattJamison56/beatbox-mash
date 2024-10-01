/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, List, ListItem, ListItemText, Box } from '@mui/material';
import VideoPlayer from '../videoPlayer/videoPlayer';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import * as pdfjsLib from 'pdfjs-dist';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface Material {
  id: number;
  title: string;
  description: string;
  type: string;
  file_url: string;
}

interface MaterialListProps {
  materials: Material[];
}

const MaterialList: React.FC<MaterialListProps> = ({ materials }) => {
  const [openViewer, setOpenViewer] = useState<boolean>(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(true); // Track if it's a video or PDF
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<{ [key: number]: string }>({}); // Cache PDF previews

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleItemClick = (material: Material) => {
    setMediaUrl(material.file_url);
    setIsVideo(material.type === 'video');
    setOpenViewer(true);
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
          <ListItem key={material.id} button onClick={() => handleItemClick(material)}>
            <Box display="flex" alignItems="center" width="100%">
              {material.type === 'video' ? (
                <video
                  src={material.file_url}
                  preload="metadata"
                  width={120}
                  style={{ marginRight: '16px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(material);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={pdfPreviewUrls[material.id] || ''}
                  alt={`PDF Preview for material ${material.id}`}
                  width={120}
                  style={{ marginRight: '16px' }}
                  onError={() => console.log(`Failed to load preview for material ID: ${material.id}`)}
                />
              )}
              <ListItemText
                primary={material.title}
                secondary={material.description}
                style={{ color: 'black' }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog open={openViewer} onClose={() => setOpenViewer(false)} maxWidth="lg" fullWidth>
        <DialogContent style={{ padding: 0 }}>
          {isVideo ? (
            <VideoPlayer videoUrl={mediaUrl} onComplete={function (): void {
              throw new Error('Function not implemented.');
            } } />
          ) : (
            <div style={{ height: '90vh', width: '100%' }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js">
                <Viewer fileUrl={mediaUrl} plugins={[defaultLayoutPluginInstance]} />
              </Worker>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaterialList;
