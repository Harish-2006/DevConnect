
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop } from 'lucide-react';
import ReactCrop, { type Crop as CropType, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRef } from 'react';

interface ImageCropDialogProps {
  showCropDialog: boolean;
  avatarPreview: string | null;
  crop: CropType;
  completedCrop: PixelCrop | undefined;
  onShowCropDialogChange: (open: boolean) => void;
  onCropChange: (crop: CropType) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onHandleCropComplete: () => void;
}

const ImageCropDialog = ({
  showCropDialog,
  avatarPreview,
  crop,
  completedCrop,
  onShowCropDialogChange,
  onCropChange,
  onCropComplete,
  onHandleCropComplete
}: ImageCropDialogProps) => {
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <Dialog open={showCropDialog} onOpenChange={onShowCropDialogChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Your Avatar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {avatarPreview && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={1}
                circularCrop
                minWidth={80}
                minHeight={80}
              >
                <img
                  ref={imgRef}
                  src={avatarPreview}
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
              onClick={onHandleCropComplete}
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
