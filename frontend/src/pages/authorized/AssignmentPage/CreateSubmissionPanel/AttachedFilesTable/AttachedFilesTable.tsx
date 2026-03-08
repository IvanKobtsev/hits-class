import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';

const MAX_TOTAL_SIZE_BYTES = 1024 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

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
  onRemove,
}) => {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeExceeded = totalSize > MAX_TOTAL_SIZE_BYTES;

  return (
    <>
      <TableContainer
        component={Paper}
        data-test-id="attached-files-table"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <span aria-hidden>📄</span>
                </TableCell>
                <TableCell>{file.name}</TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>
                  {file.status === 'uploading' && (
                    <LinearProgress
                      variant="determinate"
                      value={file.progress ?? 0}
                      aria-label="Upload progress"
                    />
                  )}
                  {file.status === 'too_large' &&
                    'Размер файла не должен превышать 400 MB'}
                  {file.status === 'error' && 'Ошибка загрузки'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onRemove(file.id)}
                    aria-label="Remove file"
                  >
                    ×
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={totalSizeExceeded} autoHideDuration={null}>
        <Alert severity="error">
          Файлы не должны весить больше 1GB в сумме
        </Alert>
      </Snackbar>
    </>
  );
};
