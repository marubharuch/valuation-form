import Cropper from "react-easy-crop";
import { useState, useCallback, useEffect } from "react";

/**
 * A4 portrait ratio (width / height)
 * Approximately 0.707
 */
const A4_RATIO = 210 / 297;

export default function CropModal({
  src,
  initialSize = 1,
  onSave,
  onClose,
}) {
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * ASPECT RATIO LOGIC:
   * 1: Full A4 (1x1)      -> A4_RATIO * (1/1) = 0.707
   * 2: Half Page (1x2)    -> A4_RATIO * (1 / 0.5) = 1.414  (Full W, Half H)
   * 3: Third Page (1x3)   -> A4_RATIO * (1 / 0.33) = 2.121 (Full W, 1/3 H)
   * 4: Quarter Page (2x2) -> A4_RATIO * (0.5 / 0.5) = 0.707 (Half W, Half H)
   * 6: Sixth Page (2x3)   -> A4_RATIO * (0.5 / 0.33) = 1.060 (Half W, 1/3 H)
   */
  const getAspect = (size) => {
    switch (size) {
      case 1: return A4_RATIO;         // 1 col, 1 row
      case 2: return A4_RATIO * 2;     // 1 col, 2 rows
      case 3: return A4_RATIO * 3;     // 1 col, 3 rows
      case 4: return A4_RATIO;         // 2 cols, 2 rows (ratio stays same as A4)
      case 6: return A4_RATIO * 1.5;   // 2 cols, 3 rows (0.5w / 0.33h = 1.5)
      default: return A4_RATIO;
    }
  };

  const currentAspect = getAspect(selectedSize);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [selectedSize]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const saveCrop = () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);

    const image = new Image();
    image.src = src;

    image.onload = () => {
      // Define output width based on a full A4 width of 2480px
      // For size 4 and 6, the output width is half of the A4 width
      const baseA4Width = 2480;
      const OUTPUT_WIDTH = (selectedSize === 4 || selectedSize === 6) 
        ? baseA4Width / 2 
        : baseA4Width;
      
      const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / currentAspect);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      onSave(canvas.toDataURL("image/jpeg", 0.95), selectedSize);
      setSaving(false);
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans">
      {/* HEADER */}
      <div className="h-14 flex items-center justify-between px-4 text-white bg-slate-900 shadow-lg">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">✕</button>
        <span className="text-xs font-bold tracking-widest uppercase">Print Selection</span>
        <div className="w-8" />
      </div>

      {/* SIZE SELECTION TABS */}
      <div className="bg-white p-2 flex flex-wrap gap-2 justify-center border-b shadow-sm">
        {[1, 2, 3, 4, 6].map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSize(s)}
            className={`px-3 py-2 rounded-lg text-[11px] font-black transition-all border-2
              ${selectedSize === s 
                ? "border-blue-600 bg-blue-600 text-white" 
                : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-300"}`}
          >
            {s} / PAGE
          </button>
        ))}
      </div>

      {/* CROPPER AREA */}
      <div className="relative flex-1 bg-zinc-900">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={currentAspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={true}
        />
      </div>

      {/* CONTROLS */}
      <div className="p-6 bg-white border-t rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setZoom(z => Math.max(1, z - 0.2))} className="w-8 h-8 flex items-center justify-center border rounded-full text-gray-400 font-bold">-</button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 flex items-center justify-center border rounded-full text-gray-400 font-bold">+</button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-500 font-bold text-sm bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={saveCrop}
            disabled={saving}
            className="flex-1 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition"
          >
            {saving ? "Saving..." : "Save for Print"}
          </button>
        </div>
      </div>
    </div>
  );
}