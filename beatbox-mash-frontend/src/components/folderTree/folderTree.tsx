// components/FolderTree.tsx
import React from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Folder, FolderOpen } from '@mui/icons-material';

interface Folder {
  id: number;
  name: string;
  parent_folder_id: number | null;
}

interface FolderTreeProps {
  folders: Folder[];
  onFolderSelect: (folderId: number) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ folders, onFolderSelect }) => {
  const renderTree = (nodes: Folder[]) => {
    return nodes.map((folder) => (
      <TreeItem
        key={folder.id}
        itemId={folder.id.toString()}
        label={folder.name}
        onClick={() => onFolderSelect(folder.id)}
        slots={{ icon: Folder }}
        style={{color: 'black'}}
      >
        {renderTree(folders.filter((f) => f.parent_folder_id === folder.id))}
      </TreeItem>
    ));
  };

  const rootFolders = folders.filter((folder) => folder.parent_folder_id === null);

  return (
    <SimpleTreeView slots={{ collapseIcon: FolderOpen, expandIcon: Folder}} style={{color: 'black'}}>
      {renderTree(rootFolders)}
    </SimpleTreeView>
  );
};

export default FolderTree;
