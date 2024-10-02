/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  MobileStepper,
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
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

const apiUrl = import.meta.env.VITE_API_URL;

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Option {
  optionId?: number;
  optionText: string;
  isCorrect?: boolean; // We'll use this when displaying the correct answer
}

interface Question {
  questionId: number;
  questionText: string;
  options: Option[];
}

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
  onTrainingCompleted: () => void;
}

const MaterialList: React.FC<MaterialListProps> = ({
  materials: initialMaterials,
  userId,
  onTrainingCompleted
}) => {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [openViewer, setOpenViewer] = useState<boolean>(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<{
    [key: number]: string;
  }>({});
  const [activeStep, setActiveStep] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userResponses, setUserResponses] = useState<{ [key: number]: number }>({});
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleStartClick = (material: Material) => {
    setCurrentMaterial(material);
    setOpenViewer(true);
    setActiveStep(0);
    setQuestions([]); // Reset questions when opening new material
    setUserResponses({});
    setShowFeedback(false);
  };

  const handleCloseViewer = () => {
    setOpenViewer(false);
    setCurrentMaterial(null);
    setActiveStep(0);
    setQuestions([]);
    setUserResponses({});
    setShowFeedback(false);
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

        // Trigger refetch after completion
        if (onTrainingCompleted) {
          onTrainingCompleted();  // <-- Trigger refetch here
        }

        // Fetch questions for the material
        fetchQuestions(currentMaterial.materialId);

        // Move to the next step (questions)
        setActiveStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error('Error marking training as completed:', error);
      }
    }
  };

  const fetchQuestions = async (materialId: number) => {
    try {
      const response = await axios.get(`${apiUrl}/training/materials/${materialId}/questions`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setUserResponses((prevResponses) => ({
      ...prevResponses,
      [questionId]: optionId,
    }));
    setShowFeedback(true);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setShowFeedback(false);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setShowFeedback(false);
  };

  const submitResponses = async () => {
    if (currentMaterial) {
      const responsesToSubmit = Object.entries(userResponses).map(([questionId, selectedOptionId]) => ({
        questionId: Number(questionId),
        selectedOptionId,
      }));

      try {
        await axios.post(`${apiUrl}/training/submit-responses`, {
          userId: userId,
          responses: responsesToSubmit,
        });
        // Handle successful submission (e.g., show a message or close the dialog)
        alert('Responses submitted successfully!');
        handleCloseViewer();
      } catch (error) {
        console.error('Error submitting responses:', error);
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

  const totalSteps = currentMaterial ? 1 + questions.length : 0;

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
          fullWidth={currentMaterial?.type !== 'video'}
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
          <DialogContent sx={{ padding: 0 }}>
            <Box
              sx={{
                maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                margin: '0 auto',
                width: '100%',
              }}
            >
              <MobileStepper
                variant="progress"
                steps={totalSteps}
                position="static"
                activeStep={activeStep}
                nextButton={
                  <Button
                    size="small"
                    onClick={handleNext}
                    disabled={
                      activeStep === totalSteps - 1 || (activeStep === 0 && !currentMaterial.isCompleted)
                    }
                  >
                    Next
                    <KeyboardArrowRight />
                  </Button>
                }
                backButton={
                  <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                    <KeyboardArrowLeft />
                    Back
                  </Button>
                }
              />

              {activeStep === 0 && (
                <>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    style={{ padding: '16px' }}
                  >
                    If you leave this page, the training will reset.
                  </Typography>
                  {currentMaterial.type === 'video' ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: 'auto',
                        position: 'relative',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '100%',
                          height: '100%',
                          maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                        }}
                      >
                        <VideoPlayer
                          videoUrl={currentMaterial.fileUrl}
                          onComplete={handleMaterialCompleted}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <div
                      style={{
                        height: '80vh',
                        width: '100%',
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative',
                      }}
                    >
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
                </>
              )}

              {activeStep > 0 && activeStep <= questions.length && (
                <Box
                  sx={{
                    maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                    margin: '0 auto',
                    width: '100%',
                    padding: 3,
                  }}
                >
                  <Typography variant="h6">
                    Question {activeStep} of {questions.length}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    {questions[activeStep - 1].questionText}
                  </Typography>
                  {questions[activeStep - 1].options.map((option) => (
                    <Button
                      key={option.optionId}
                      variant={
                        userResponses[questions[activeStep - 1].questionId] === option.optionId
                          ? 'contained'
                          : 'outlined'
                      }
                      color="primary"
                      fullWidth
                      style={{ marginBottom: '8px', textAlign: 'left' }}
                      onClick={() =>
                        !userResponses[questions[activeStep - 1].questionId] &&
                        handleOptionSelect(questions[activeStep - 1].questionId, option.optionId!)
                      }
                      disabled={!!userResponses[questions[activeStep - 1].questionId]}
                    >
                      {option.optionText}
                    </Button>
                  ))}
                  {showFeedback && userResponses[questions[activeStep - 1].questionId] && (
                    <Typography
                      variant="subtitle1"
                      color={
                        questions[activeStep - 1].options.find(
                          (option) =>
                            option.optionId ===
                            userResponses[questions[activeStep - 1].questionId]
                        )?.isCorrect
                          ? 'green'
                          : 'red'
                      }
                      style={{ marginTop: '16px' }}
                    >
                      {questions[activeStep - 1].options.find(
                        (option) =>
                          option.optionId ===
                          userResponses[questions[activeStep - 1].questionId]
                      )?.isCorrect
                        ? 'Correct!'
                        : 'Incorrect.'}
                    </Typography>
                  )}
                </Box>
              )}

              {activeStep === totalSteps - 1 && activeStep > 0 && (
                <Box
                  sx={{
                    maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                    margin: '0 auto',
                    width: '100%',
                    padding: 3,
                    textAlign: 'center',
                  }}
                >
                  <Button variant="contained" color="primary" onClick={submitResponses}>
                    Submit All Responses
                  </Button>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MaterialList;