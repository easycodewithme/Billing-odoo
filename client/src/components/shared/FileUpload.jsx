import { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function FileUpload({
  onUpload,
  accept = '.jpg,.jpeg,.png,.webp',
  maxSize = 5 * 1024 * 1024,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const isImageAccept = accept.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);

  const validateAndProcess = useCallback(
    (file) => {
      setError('');

      if (!file) return;

      // Validate size
      if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
        setError(`File size exceeds ${maxMB}MB limit.`);
        return;
      }

      // Validate type based on accept
      const acceptedExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptedExtensions.includes(fileExtension)) {
        setError(`File type not accepted. Allowed: ${accept}`);
        return;
      }

      setFileName(file.name);

      // Generate preview for images
      if (isImageAccept && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      onUpload?.(file);
    },
    [accept, maxSize, onUpload, isImageAccept]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    validateAndProcess(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    validateAndProcess(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const clearFile = () => {
    setPreview(null);
    setFileName('');
    setError('');
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 rounded-md object-contain"
            />
            <Button
              variant="destructive"
              size="icon-xs"
              className="absolute -top-2 -right-2"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click or drag to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {accept.replaceAll('.', '').toUpperCase().replaceAll(',', ', ')} up to{' '}
              {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </>
        )}

        {!preview && fileName && (
          <p className="mt-2 text-sm text-muted-foreground">{fileName}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
