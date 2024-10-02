/* eslint-disable react-hooks/exhaustive-deps */
// pages/trainingPage.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import FolderTree from '../../../components/folderTree/folderTree';
import MaterialList from '../../../components/materialList/materialList';
import UploadForm from '../../../components/trainingUploadForm/trainingUploadForm';
import CreateFolderDialog from '../../../components/createFolderDialogue/createFolderDialogue';
import QuestionList from '../../../components/questionList/questionList';

const apiUrl = import.meta.env.VITE_API_URL;

interface Folder {
  id: number;
  name: string;
  parent_folder_id: number | null;
}

interface Material {
  id: number;
  title: string;
  description: string;
  type: string;
  file_url: string;
}

const TrainingPage: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [createFolderOpen, setCreateFolderOpen] = useState<boolean>(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`${apiUrl}/training/folders`);
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchMaterials = async () => {
    if (!selectedFolderId) return;

    try {
      const response = await fetch(
        `${apiUrl}/training/materials?folderId=${selectedFolderId}`
      );
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [selectedFolderId]);

  const handleFolderSelect = (folderId: number) => {
    setSelectedFolderId(folderId);
    setSelectedMaterialId(null); // Reset selected material when folder changes
  };

  const handleMaterialSelect = (materialId: number) => {
    setSelectedMaterialId(materialId);
  };

  return (
    <Box display="flex" height="100vh">
      <Box width="300px" p={2} borderRight="1px solid #ccc">
        <Typography variant="h6" style={{ color: 'black' }}>
          Folders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateFolderOpen(true)}
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Create Folder +
        </Button>
        <FolderTree folders={folders} onFolderSelect={handleFolderSelect} />
      </Box>
      <Box flex={1} p={2}>
        {selectedFolderId ? (
          <>
            <Typography variant="h6" style={{ color: 'black' }}>
              Materials in Folder
            </Typography>
            <UploadForm folderId={selectedFolderId} onUploadSuccess={fetchMaterials} />
            <Divider sx={{ marginY: 2 }} />
            <MaterialList materials={materials} onMaterialSelect={handleMaterialSelect} />
            {selectedMaterialId && (
              <>
                <Divider sx={{ marginY: 2 }} />
                <Typography variant="h6" style={{ color: 'black' }}>
                  Questions for Selected Material
                </Typography>
                <QuestionList materialId={selectedMaterialId} />
              </>
            )}
          </>
        ) : (
          <Typography variant="h6" style={{ color: 'black' }}>
            Select a folder to view materials
          </Typography>
        )}
      </Box>
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        parentFolderId={selectedFolderId}
        onFolderCreated={fetchFolders}
      />
    </Box>
  );
};

export default TrainingPage;
