import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>; // Returns image URL
  onRemove?: () => void;
  existingImage?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  maxSize?: number; // in bytes
  aspectRatio?: number; // width/height
}

export default function ImageUpload({
  onUpload,
  onRemove,
  existingImage,
  label,
  hint,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > maxSize) {
      setError(`Image size exceeds maximum of ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(existingImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="space-y-2">
        {preview ? (
          <div className="relative inline-block">
            <div
              className={clsx(
                'border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100',
                aspectRatio ? `aspect-[${aspectRatio}]` : 'aspect-square',
                'max-w-xs'
              )}
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={clsx(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              disabled
                ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary-400 cursor-pointer'
            )}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload image</p>
                {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}





