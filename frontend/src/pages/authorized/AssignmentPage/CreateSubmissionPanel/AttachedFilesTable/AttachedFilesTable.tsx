import React from 'react';
import styles from './AttachedFilesTable.module.scss';

const MAX_TOTAL_SIZE_BYTES = 1024 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <table className={styles.table} data-test-id="attached-files-table">
        <thead>
          <tr>
            <th className={styles.colIcon} />
            <th className={styles.colName}>Имя</th>
            <th className={styles.colSize}>Размер</th>
            <th className={styles.colProgress}>Статус</th>
            <th className={styles.colAction} />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td className={styles.cellIcon}>
                <span aria-hidden>📄</span>
              </td>
              <td className={styles.cellName}>{file.name}</td>
              <td className={styles.cellSize}>{formatFileSize(file.size)}</td>
              <td>
                {file.status === 'uploading' && (
                  <progress
                    className={styles.progress}
                    value={file.progress ?? 0}
                    max={100}
                    aria-label="Upload progress"
                  />
                )}
                {file.status === 'too_large' && (
                  <span className={styles.errorText}>
                    Размер файла не должен превышать 400 MB
                  </span>
                )}
                {file.status === 'error' && (
                  <span className={styles.errorText}>Ошибка загрузки</span>
                )}
              </td>
              <td className={styles.cellAction}>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => onRemove(file.id)}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalSizeExceeded && (
        <div className={styles.toast} role="alert">
          Файлы не должны весить больше 1GB в сумме
        </div>
      )}
    </>
  );
};
