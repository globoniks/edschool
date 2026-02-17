import { useState, useRef } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onUpload: (files: File[]) => Promise<string[]>; // Returns file URLs
  onRemove?: (url: string) => void;
  existingFiles?: string[];
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export default function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  onRemove,
  existingFiles = [],
  label,
  hint,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: string[] = [];

    selectedFiles.forEach((file) => {
      if (file.size > maxSize) {
        newErrors.push(`${file.name} exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    if (multiple) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    } else {
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    try {
      const urls = await onUpload(files);
      setUploadedUrls((prev) => [...prev, ...urls]);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setErrors([error.message || 'Upload failed']);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (url: string) => {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
    if (onRemove) {
      onRemove(url);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    }
    if (file.type.includes('pdf')) {
      return '📄';
    }
    if (file.type.includes('word') || file.type.includes('document')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 cursor-pointer'
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Click to upload or drag and drop
        </p>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {files.length} file(s) selected
            </p>
            <button
              onClick={handleUpload}
              disabled={isUploading || disabled}
              className="btn btn-primary text-sm flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Uploaded Files</p>
          <div className="space-y-2">
            {uploadedUrls.map((url, index) => {
              const fileName = url.split('/').pop() || `File ${index + 1}`;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-gray-400" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {fileName}
                    </a>
                  </div>
                  {onRemove && (
                    <button
                      onClick={() => removeUploadedFile(url)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}





