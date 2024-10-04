/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
// MaterialList.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Box,
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
  materials,
  userId,
  onTrainingCompleted,
}) => {
  const [openViewer, setOpenViewer] = useState<boolean>(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
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
        // Fetch questions for the material
        await fetchQuestions(currentMaterial.materialId);

        // Move to the next step (questions)
        setActiveStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error('Error after material completion:', error);
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
      const responsesToSubmit = Object.entries(userResponses).map(
        ([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId,
        })
      );

      try {
        // Submit the user's responses
        await axios.post(`${apiUrl}/training/submit-responses`, {
          userId: userId,
          responses: responsesToSubmit,
        });

        // Now mark the training as completed
        await axios.post(`${apiUrl}/training/complete`, {
          userId: userId,
          trainingMaterialId: currentMaterial.materialId,
        });

        // Trigger refetch after completion
        if (onTrainingCompleted) {
          onTrainingCompleted();
        }

        // Handle successful submission (e.g., show a message or close the dialog)
        handleCloseViewer();
      } catch (error) {
        console.error('Error submitting responses:', error);
      }
    }
  };

  const totalSteps = currentMaterial ? 1 + questions.length : 0;

  useEffect(() => {
    console.log('Updated questions:', questions);
  }, [questions]);

  return (
    <>
      <Grid container spacing={2}>
        {materials.map((material) => (
          <Grid item xs={12} sm={6} md={6} lg={4} xl={2.3} key={material.materialId}>
            <MaterialCard material={material} onStartClick={handleStartClick} />
          </Grid>
        ))}
      </Grid>

      {currentMaterial && (
        <Dialog
          open={openViewer}
          onClose={handleCloseViewer}
          maxWidth="lg"
          fullWidth={currentMaterial?.type !== 'video'}
          fullScreen
        >
          <DialogTitle sx={{ background: '#fdfcf3', textAlign: 'center' }}>
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
          <DialogContent
            sx={{
              padding: 0,
              background: '#fdfcf3',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                margin: '0 auto',
                width: '100%',
              }}
            >
              <MobileStepper
                sx={{ background: '#fdfcf3', marginTop: '-50px' }}
                variant="progress"
                steps={totalSteps}
                position="static"
                activeStep={activeStep}
                nextButton={
                  <Button
                    size="small"
                    onClick={handleNext}
                    disabled={
                      activeStep === totalSteps - 1 ||
                      (activeStep === 0 && !currentMaterial.isCompleted)
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
                    style={{ padding: '16px', textAlign: 'center' }}
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
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
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
                    textAlign: 'center',
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
                      style={{ marginBottom: '8px', textAlign: 'center' }}
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
                      style={{ marginTop: '16px', textAlign: 'center' }}
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

interface MaterialCardProps {
  material: Material;
  onStartClick: (material: Material) => void;
}

interface MaterialCardProps {
  material: Material;
  onStartClick: (material: Material) => void;
}

const videoPlaceholder = 'https://via.placeholder.com/200x150?text=Video+Preview'; // Replace with your placeholder image URL or path


const MaterialCard: React.FC<MaterialCardProps> = ({ material, onStartClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const materialType = material.type.toLowerCase();
    if (materialType === 'document') {
      generatePdfPreview(material.fileUrl).then((url) => {
        setPreviewUrl(url);
      });
    } else {
      setPreviewUrl(''); // Handle other types if necessary
    }
  }, [material]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Card
      sx={{
        width: 300,
        height: 340,
        borderRadius: 2,
        boxShadow: 3,
        position: 'relative',
        perspective: '1000px',
        cursor: 'pointer',
        margin: '0 auto',
        background: '#6f65ac',
        color: 'white',
      }}
      onClick={handleCardClick}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <CardContent>
            <Typography gutterBottom variant="h6" component="div">
              {material.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 210,
              }}
            >
              {material.type.toLowerCase() === 'video' ? (
                <video
                  src={material.fileUrl}
                  preload="metadata"
                  width="100%"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : material.type.toLowerCase() === 'document' ? (
                <img
                  src={previewUrl}
                  alt={material.title}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                // Handle other material types or display a default placeholder
                <Typography variant="body2">No preview available</Typography>
              )}
            </Box>
          </CardContent>
          <CardActions
            sx={{ justifyContent: 'center' }}
            onClick={(event) => event.stopPropagation()}
          >
            {material.isCompleted ? (
              <IconButton onClick={() => onStartClick(material)}>
                <CheckCircleIcon sx={{ color: 'white' }} />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                sx={{ backgroundColor: 'white', color: 'black' }}
                onClick={() => onStartClick(material)}
              >
                Start
              </Button>
            )}
          </CardActions>
        </Box>
        {/* Back Side */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent>
            <Typography variant="body2" color="white">
              {material.description}
            </Typography>
          </CardContent>
          <CardActions
            sx={{ justifyContent: 'center' }}
            onClick={(event) => event.stopPropagation()}
          >
            {material.isCompleted ? (
              <IconButton onClick={() => onStartClick(material)}>
                <CheckCircleIcon sx={{ color: 'white' }} />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                sx={{ backgroundColor: 'white', color: 'black' }}
                onClick={() => onStartClick(material)}
              >
                Start
              </Button>
            )}
          </CardActions>
        </Box>
      </Box>
    </Card>
  );
};

// Function to generate PDF preview thumbnails
const generatePdfPreview = async (fileUrl: string): Promise<string> => {
  try {
    const pdf = await pdfjsLib.getDocument(fileUrl).promise;
    const page = await pdf.getPage(1);
    const scale = 0.2;
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
    return canvas.toDataURL();
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return '';
  }
};

export default MaterialList;
