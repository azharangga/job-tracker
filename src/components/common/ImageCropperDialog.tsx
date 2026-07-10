import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCrop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
}) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  const handleSave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    // Create a 1:1 canvas (300x300 px) for high quality crop
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);

      // Save context state
      ctx.save();

      // Translate to canvas center (150, 150)
      ctx.translate(150, 150);

      // Apply current zoom
      ctx.scale(zoom, zoom);

      // Translate by user drag offset (scaled from 256px visual container to 300px canvas size)
      const scaleMultiplier = 300 / 256;
      ctx.translate(offset.x * scaleMultiplier, offset.y * scaleMultiplier);

      // Draw the image centered
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const aspect = imgWidth / imgHeight;

      // Since image CSS is width: 100% and height: auto, it always fills the container width (256px / 300px canvas equivalent)
      const drawW = 300;
      const drawH = 300 / aspect;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCrop(blob);
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{t("common.edit", "Edit Image")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center gap-6">
          {/* Circular Frame Overlay */}
          <div
            className="w-64 h-64 rounded-full border-2 border-primary overflow-hidden relative bg-surface-muted select-none touch-none shadow-inner"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop source"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="absolute max-w-none origin-center cursor-move"
              style={{
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                width: "100%",
                height: "auto",
                top: "50%",
                left: "50%",
              }}
              draggable={false}
            />
            {/* Guide circle outline */}
            <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
          </div>

          {/* Zoom Slider */}
          <div className="w-full space-y-2 px-4">
            <div className="flex justify-between text-xs font-medium text-ink-secondary">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
