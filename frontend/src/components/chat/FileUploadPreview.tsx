import React from 'react';
import { X, File, Image, FileText, Music, Video } from 'lucide-react';

interface FilePreview {
  file: File;
  preview?: string;
  id: string;
}

interface FileUploadPreviewProps {
  files: FilePreview[];
  onRemove: (id: string) => void;
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="px-4 py-3 bg-neutral-800 border-t border-neutral-700 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-neutral-400 uppercase">Attachments ({files.length})</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {files.map((filePreview) => {
          const Icon = getFileIcon(filePreview.file);
          const isImage = filePreview.file.type.startsWith('image/');

          return (
            <div
              key={filePreview.id}
              className="relative group bg-neutral-750 border border-neutral-600 rounded-lg overflow-hidden hover-lift"
            >
              {isImage && filePreview.preview ? (
                // Image preview
                <div className="relative w-32 h-32">
                  <img
                    src={filePreview.preview}
                    alt={filePreview.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium px-2 text-center truncate max-w-full">
                      {filePreview.file.name}
                    </span>
                  </div>
                </div>
              ) : (
                // File icon preview
                <div className="w-32 h-32 flex flex-col items-center justify-center p-3">
                  <Icon className="w-8 h-8 text-primary-400 mb-2" />
                  <span className="text-xs text-neutral-300 font-medium text-center truncate max-w-full">
                    {filePreview.file.name}
                  </span>
                  <span className="text-xs text-neutral-500 mt-1">
                    {formatFileSize(filePreview.file.size)}
                  </span>
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => onRemove(filePreview.id)}
                className="absolute top-1 right-1 p-1 bg-error hover:bg-error/80 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                title="Remove file"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* File size badge */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                {formatFileSize(filePreview.file.size)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
