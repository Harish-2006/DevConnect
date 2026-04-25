
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop } from 'lucide-react';
import ReactCrop, { type Crop as CropType, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRef, useState } from 'react';

interface ImageCropDialogProps {
  showCropDialog: boolean;
  imagePreview: string | null;
  onShowCropDialogChange: (open: boolean) => void;
  onCropComplete: (croppedFile: File) => void;
  originalFile: File | null;
}

const ImageCropDialog = ({
  showCropDialog,
  imagePreview,
  onShowCropDialogChange,
  onCropComplete,
  originalFile
}: ImageCropDialogProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); // Default to landscape for posts

  const aspectRatios = [
    { label: 'Landscape (16:9)', value: 16/9 },
    { label: 'Square (1:1)', value: 1 },
    { label: 'Portrait (4:5)', value: 4/5 },
    { label: 'Wide (2:1)', value: 2 }
  ];

  const handleAspectRatioChange = (value: string) => {
    const ratio = parseFloat(value);
    setAspectRatio(ratio);
    // Reset crop when aspect ratio changes
    setCrop({
      unit: '%',
      width: 90,
      height: ratio > 1 ? 90 / ratio : 90,
      x: 5,
      y: 5
    });
  };

  const createCroppedImage = async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas dimensions based on aspect ratio, optimized for posts
    let canvasWidth = 800;
    let canvasHeight = Math.round(canvasWidth / aspectRatio);

    // Ensure minimum dimensions for good quality
    if (canvasHeight < 400) {
      canvasHeight = 400;
      canvasWidth = Math.round(canvasHeight * aspectRatio);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        const file = new File([blob], originalFile?.name || 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedFile = await createCroppedImage(imgRef.current, completedCrop);
        onCropComplete(croppedFile);
        onShowCropDialogChange(false);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  };

  return (
    <Dialog open={showCropDialog} onOpenChange={onShowCropDialogChange}>
      <DialogContent className="max-w-4xl glass-card">
        <DialogHeader>
          <DialogTitle>Crop Your Image for Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Aspect Ratio:</label>
            <Select value={aspectRatio.toString()} onValueChange={handleAspectRatioChange}>
              <SelectTrigger className="w-48 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value.toString()}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {imagePreview && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={aspectRatio}
                minWidth={80}
                minHeight={80}
              >
                <img
                  ref={imgRef}
                  src={imagePreview}
                  alt="Crop preview"
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onShowCropDialogChange(false)}
              className="glass-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black"
            >
              <Crop className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
