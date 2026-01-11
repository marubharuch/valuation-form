import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";

export default function CropModal({ src, onSave, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.7); // start zoomed out
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const saveCrop = () => {
    const image = new Image();
    image.src = src;

    image.onload = () => {
      // A4 cell size (2 x 3 layout)
      const TARGET_W = 1200;
      const TARGET_H = 900;

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_W;
      canvas.height = TARGET_H;
      const ctx = canvas.getContext("2d");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        TARGET_W,
        TARGET_H
      );

      onSave(canvas.toDataURL("image/jpeg", 0.8));
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* Header */}
      <div className="h-14 flex items-center px-4 text-white bg-black/80">
        <button onClick={onClose} className="text-2xl mr-4">✕</button>
        <span className="text-sm">Adjust image for A4 print</span>
      </div>

      {/* Cropper */}
      <div className="relative flex-1 bg-black">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          restrictPosition={false}
        />
      </div>

      {/* Controls */}
      <div className="p-4 bg-white space-y-3">
        <div className="text-xs text-gray-500 text-center">
          Drag image • Zoom to fit inside box
        </div>

        <input
          type="range"
          min={0.5}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-3"
          >
            Cancel
          </button>

          <button
            onClick={saveCrop}
            className="flex-1 bg-blue-600 text-white rounded-lg py-3"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
