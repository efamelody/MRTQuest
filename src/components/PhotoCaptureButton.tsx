'use client';

import { useRef, useState } from 'react';

interface PhotoCaptureButtonProps {
  attractionId: string;
  attractionName: string;
  userLatitude: number;
  userLongitude: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PhotoCaptureButton({
  attractionId,
  attractionName,
  userLatitude,
  userLongitude,
  onSuccess,
  onError,
}: PhotoCaptureButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Compresses an image using Canvas
   * Target: max 2-5MB for API transmission
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate dimensions: max 1920x1440 for reasonable quality
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1440;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with quality compression
          // Start at 0.7 quality and iterate if needed
          let quality = 0.7;
          let base64 = canvas.toDataURL('image/jpeg', quality);

          // If still too large, reduce quality further
          while (base64.length > 5242880 && quality > 0.3) {
            // 5MB limit
            quality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', quality);
          }

          // Remove the data URL prefix to get just the base64
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file.');
      return;
    }

    // Validate file size (warn if > 10MB uncompressed)
    if (file.size > 10485760) {
      onError('Image file is too large. Please select a smaller image.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);

    try {
      // Compress image
      const compressedBase64 = await compressImage(file);

      // Call the backend API
      const response = await fetch('/api/visits/verify-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attractionId,
          base64Image: compressedBase64,
          userLatitude,
          userLongitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error || 'Photo verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success
      setSuccessMessage(data.message);
      onSuccess();
      setIsLoading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      onError(`Failed to process image: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      <button
        type="button"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-full bg-[#00A959] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? 'Verifying photo…' : '📷 Verify with photo'}
      </button>

      {successMessage && (
        <p className="text-xs text-emerald-700 font-medium">{successMessage}</p>
      )}
    </div>
  );
}
