import React from 'react';

export type AttachedFileItem = {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error' | 'too_large';
  progress?: number;
};

export type AttachedFilesTableProps = {
  files: AttachedFileItem[];
  onRemove: (id: string) => void;
};

export const AttachedFilesTable: React.FC<AttachedFilesTableProps> = ({
  files,
  onRemove: _onRemove,
}) => (
  <div data-test-id="attached-files-table">
    AttachedFilesTable (files: {files.length}, onRemove provided)
  </div>
);
