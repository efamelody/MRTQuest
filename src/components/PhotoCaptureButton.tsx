'use client';

import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface PhotoCaptureButtonProps {
  attractionId: string;
  attractionName: string;
  userLatitude: number;
  userLongitude: number;
  canTakePhoto: boolean;
  lockReason?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface VerifyPhotoResponse {
  success: boolean;
  message?: string;
  error?: string;
  confidence?: number;
  reason?: string;
  nearThreshold?: boolean;
  hints?: string;
  metadataWarning?: string | null;
}

export default function PhotoCaptureButton({
  attractionId,
  attractionName,
  userLatitude,
  userLongitude,
  canTakePhoto,
  lockReason,
  onSuccess,
  onError,
}: PhotoCaptureButtonProps) {
  const webcamRef = useRef<Webcam | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [imageDateTaken, setImageDateTaken] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload'>('camera');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [proTip, setProTip] = useState<string | null>(null);
  const [hints, setHints] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [metadataWarning, setMetadataWarning] = useState<string | null>(null);

  const compressDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        let width = img.width;
        let height = img.height;
        const maxEdge = 1024;

        if (width > height && width > maxEdge) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else if (height >= width && height > maxEdge) {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        while (compressedDataUrl.length > 5242880 && quality > 0.4) {
          quality -= 0.08;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const base64Data = compressedDataUrl.split(',')[1];
        if (!base64Data) {
          reject(new Error('Failed to compress image'));
          return;
        }

        resolve(base64Data);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to parse file contents'));
          return;
        }

        resolve(result);
      };

      reader.readAsDataURL(file);
    });
  };

  const buildProTip = useCallback((reason?: string) => {
    const reasonText = (reason || '').toLowerCase();

    if (reasonText.includes('blurry') || reasonText.includes('blur')) {
      return 'Pro-tip: Hold your phone steady and tap to focus before capturing.';
    }

    if (reasonText.includes('framing') || reasonText.includes('fit') || reasonText.includes('whole')) {
      return 'Pro-tip: Step back slightly so the full landmark fits in frame.';
    }

    if (reasonText.includes('dark') || reasonText.includes('light')) {
      return 'Pro-tip: Move to better lighting and avoid strong backlight.';
    }

    if (reasonText.includes('obstruct') || reasonText.includes('blocked')) {
      return 'Pro-tip: Reposition to keep the landmark clear of people or objects.';
    }

    return 'Pro-tip: Keep the landmark centered and clearly visible before retrying.';
  }, []);

  const submitImage = useCallback(
    async (base64Image: string) => {
      setIsLoading(true);
      setSuccessMessage(null);
      setProTip(null);
      setHints(null);
      setShowHints(false);
      setMetadataWarning(null);

      try {
        const response = await fetch('/api/visits/verify-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attractionId,
            base64Image,
            userLatitude,
            userLongitude,
            capturedAt,
            imageDateTaken,
            captureSource,
          }),
        });

        const data: VerifyPhotoResponse = await response.json();

        if (data.metadataWarning) {
          setMetadataWarning(data.metadataWarning);
        }

        if (!response.ok) {
          const reasonMessage = data.reason || data.error || 'Photo verification failed. Please try again.';
          const tip = buildProTip(data.reason);
          setProTip(tip);

          if (data.nearThreshold && data.hints) {
            setHints(data.hints);
          }

          onError(reasonMessage);
          setIsLoading(false);
          return;
        }

        setSuccessMessage(data.message || `Check-in verified! ${attractionName} unlocked.`);
        onSuccess();

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        onError(`Failed to process image: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [
      attractionId,
      attractionName,
      buildProTip,
      capturedAt,
      captureSource,
      imageDateTaken,
      onError,
      onSuccess,
      userLatitude,
      userLongitude,
    ],
  );

  const handleCapture = () => {
    if (!canTakePhoto) {
      onError(lockReason || 'Move inside the check-in radius before taking a photo.');
      return;
    }

    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      onError('Could not capture image. Please try again.');
      return;
    }

    setCaptureSource('camera');
    setCapturedAt(new Date().toISOString());
    setImageDateTaken(null);
    setCapturedImage(screenshot);
    setProTip(null);
    setHints(null);
    setShowHints(false);
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

    try {
      const dataUrl = await fileToDataUrl(file);
      setCaptureSource('upload');
      setCapturedAt(new Date().toISOString());
      setImageDateTaken(new Date(file.lastModified).toISOString());
      setCapturedImage(dataUrl);
      setIsCameraOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      onError(`Failed to process image: ${errorMessage}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVerify = async () => {
    if (!capturedImage) {
      onError('Capture or select a photo first.');
      return;
    }

    const compressedBase64 = await compressDataUrl(capturedImage);
    await submitImage(compressedBase64);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSuccessMessage(null);
    setProTip(null);
    setHints(null);
    setShowHints(false);
    setMetadataWarning(null);
    setIsCameraOpen(true);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      {!isCameraOpen && !capturedImage && (
        <button
          type="button"
          disabled={isLoading || !canTakePhoto}
          onClick={() => {
            setIsCameraOpen(true);
            setProTip(null);
            setHints(null);
            setShowHints(false);
          }}
          className="w-full rounded-full bg-[#00A959] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Open camera
        </button>
      )}

      {isCameraOpen && !capturedImage && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-3">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Webcam
              ref={webcamRef}
              mirrored={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="h-56 w-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canTakePhoto}
              onClick={handleCapture}
              className="flex-1 rounded-full bg-[#00A959] px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Take photo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCameraOpen(false);
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Use image from gallery
          </button>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-3">
          <img
            src={capturedImage}
            alt={`Captured view for ${attractionName}`}
            className="h-56 w-full rounded-xl border border-slate-200 object-cover"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isLoading || !canTakePhoto}
              onClick={handleVerify}
              className="flex-1 rounded-full bg-[#00A959] px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? 'Verifying photo...' : 'Verify photo'}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleRetake}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {!canTakePhoto && lockReason && (
        <p className="text-xs text-amber-700">{lockReason}</p>
      )}

      {successMessage && (
        <p className="text-xs text-emerald-700 font-medium">{successMessage}</p>
      )}

      {metadataWarning && <p className="text-xs text-amber-700">{metadataWarning}</p>}

      {proTip && <p className="text-xs text-slate-700">{proTip}</p>}

      {hints && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setShowHints((prev) => !prev);
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            {showHints ? 'Hide hints' : 'Hints'}
          </button>
          {showHints && <p className="text-xs text-slate-700">{hints}</p>}
        </div>
      )}
    </div>
  );
}
