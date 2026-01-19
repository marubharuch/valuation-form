import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc,updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import CropModal from "../components/CropModal";
import CaseNavbar from "../components/CaseNavbar";

import { captureAccurateLocation } from "../utils/captureAccurateLocation";

const PRINT_SIZES = [1, 2, 3, 4, 6];

/* ---------- utility: URL → base64 ---------- */
async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function Documents() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // UI MODE
  const [mode, setMode] = useState("pages"); // pages | new

  // SAVED PAGES
  const [pages, setPages] = useState([]);

  // NEW / EDIT PAGE IMAGES (base64)
  const [images, setImages] = useState([]);

  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const [gpsBusy, setGpsBusy] = useState(false);
const [gpsStep, setGpsStep] = useState(0);
const [locationText, setLocationText] = useState("");

const [propertyLocation, setPropertyLocation] = useState(null);
const [mapThumb, setMapThumb] = useState(null);


  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data() || {};

      setPages(data.documents?.pages || []);

      // prepare raw pics for new page
      if (data.rowPics?.length) {
        const rawImages = await Promise.all(
          data.rowPics.map(async (r) => ({
            src: await urlToBase64(r.imageUrl),
            title: "",
            printSize: null,
            selected: false,
            source: "raw",
          }))
        );
        setImages(rawImages);
      }
      setPropertyLocation(data.propertyLocation || null);
setLocationText(data.propertyLocationText || "");


      setLoading(false);
    }


    load();
  }, [caseId]);

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  /* ---------------- IMAGE HELPERS ---------------- */
  const toggleSelected = (index) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const changePrintSize = (index, size) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index
          ? { ...img, printSize: size, selected: true }
          : img
      )
    );
  };

const onCropSave = (base64) => {
  setImages((prev) => {
    // Editing existing image
    if (cropIndex !== null) {
      return prev.map((img, i) =>
        i === cropIndex ? { ...img, src: base64 } : img
      );
    }

    // New map / clipboard image
    const newImg = {
      src: base64,
      title: "Location Map",
      printSize: 4,
      selected: true,
      source: "clipboard",
    };

    // 🔥 store thumbnail for GPS box
    setMapThumb(base64);

    return [newImg, ...prev];
  });

  setCropSrc(null);
  setCropIndex(null);
};



  /* ---------------- OPEN SAVED PAGE ---------------- */
  const openSavedPage = async (page) => {
    const convertedImages = await Promise.all(
      page.images.map(async (img) => ({
        ...img,
        src: await urlToBase64(img.imageUrl), // 🔥 CRITICAL FIX
        source: "page",
        selected: true,
      }))
    );

    navigate(`/docpreview/${caseId}`, {
      state: {
        images: convertedImages,
        footerText: page.footerText || "",
        pageId: page.pageId,
      },
    });
  };
/*----gps handler ----*/
  async function handleCaptureGPS() {
  try {
    setGpsBusy(true);

    const snap = await getDoc(doc(db, "cases", caseId));
    const existing = snap.data()?.propertyLocation || null;

    const loc = await captureAccurateLocation({
      existingLocation: existing,
      onProgress: (step) => setGpsStep(step),
    });

    await updateDoc(doc(db, "cases", caseId), {
      propertyLocation: {
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        capturedAt: loc.capturedAt,
      },
      propertyLocationText: loc.text,
    });

    
    setPropertyLocation({
  lat: loc.lat,
  lng: loc.lng,
  accuracy: loc.accuracy,
  capturedAt: loc.capturedAt,
});
setLocationText(loc.text);

  } catch (e) {
    console.log(e.message);
  } finally {
    setGpsBusy(false);
    setGpsStep(0);
  }
}
function openGoogleMap(location) {
  if (!location?.lat || !location?.lng) return;

  window.open(
    `https://www.google.com/maps?q=${location.lat},${location.lng}&t=k`,
    "_blank"
  );
}

async function pasteFromClipboard() {
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      alert("Clipboard image not supported in this browser");
      return;
    }

    const items = await navigator.clipboard.read();

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type);
          const reader = new FileReader();

          reader.onload = () => {
            // open crop editor
             setCropIndex(null);
            setCropSrc(reader.result);
          };

          reader.readAsDataURL(blob);
          return;
        }
      }
    }

    alert("No image found in clipboard");
  } catch (err) {
    console.error(err);
    alert("Failed to read clipboard image");
  }
}



  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <CaseNavbar />

      <h2 className="text-lg font-semibold mb-4">Documents</h2>
<div className="mb-4 rounded-lg border bg-gray-50 p-3">
  {/* HEADER */}
  <div className="mb-2 flex items-center gap-2 font-medium text-sm">
    📍 <span>Property Location</span>
  </div>

  {/* ACTION ROW */}
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
    {/* GET GPS */}
    <button
      onClick={handleCaptureGPS}
      disabled={gpsBusy}
      className={`h-10 rounded px-3 text-sm font-medium text-white ${
        gpsBusy ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {gpsBusy ? `Collecting ${gpsStep}/7` : "📍 Get"}
    </button>

    {/* LOCATION TEXT */}
    <input
      type="text"
      value={locationText}
      readOnly
      placeholder="Location not captured"
      className="h-10 w-full rounded border bg-white px-2 text-sm"
    />

    {/* MAP BUTTON */}
    <button
      onClick={() => openGoogleMap(propertyLocation)}
      disabled={!propertyLocation}
      className={`h-10 rounded px-3 text-sm font-medium text-white ${
        propertyLocation
          ? "bg-green-600 hover:bg-green-700"
          : "bg-gray-400 cursor-not-allowed"
      }`}
    >
      🗺 Map
    </button>

    {/* PASTE BUTTON */}
    <button
      onClick={pasteFromClipboard}
      className="h-10 rounded bg-purple-600 px-3 text-sm font-medium text-white hover:bg-purple-700"
    >
      📋 Paste
    </button>
  </div>

  {/* THUMBNAIL PREVIEW */}
  {mapThumb && (
    <div className="mt-3 flex items-center gap-3 rounded border bg-white p-2">
      <img
        src={mapThumb}
        alt="Map thumbnail"
        className="h-20 w-20 rounded border object-cover cursor-pointer"
        onClick={() => {
          setCropIndex(null);
          setCropSrc(mapThumb);
        }}
      />

      <div className="flex-1">
        <div className="text-sm font-medium">
          Location Map Image
        </div>
        <div className="text-xs text-gray-500">
          Tap image to re-crop or adjust
        </div>
      </div>
    </div>
  )}

  {/* ACCURACY */}
  {propertyLocation && (
    <div className="mt-2 text-xs text-gray-500">
      Accuracy: ±{propertyLocation.accuracy.toFixed(1)} m
    </div>
  )}
</div>


      {/* ================= PAGE LIST ================= */}
      {mode === "pages" && (
        <>
          <button
            onClick={() => setMode("new")}
            className="mb-4 border px-4 py-2 rounded w-full"
          >
            + Create New Page
          </button>

          <div className="space-y-2">
            {pages.length === 0 && (
              <div className="text-sm text-gray-500">
                No pages created yet
              </div>
            )}

   {pages.map((p, pageIndex) => (
  <div
    key={p.pageId}
    onClick={() => openSavedPage(p)}
    className="border p-3 rounded cursor-pointer hover:bg-gray-50"
  >
    {/* HEADER */}
    <div className="font-medium mb-2">
      Page {pageIndex + 1} • {p.images.length} images
    </div>

    {/* THUMBNAILS */}
    <div className="flex gap-2 mb-2">
      {p.images.slice(0, 3).map((img, i) => (
        <img
          key={i}
          src={img.imageUrl}
          alt={img.title || ""}
          className="w-16 h-16 object-cover rounded border"
        />
      ))}

      {p.images.length > 3 && (
        <div className="w-16 h-16 flex items-center justify-center text-xs text-gray-500 border rounded">
          +{p.images.length - 3}
        </div>
      )}
    </div>

    {/* TITLES */}
    <div className="text-sm text-gray-600 space-y-0.5">
      {p.images.map((img, i) =>
        img.title ? <div key={i}>• {img.title}</div> : null
      )}
    </div>
  </div>
))}


          </div>
        </>
      )}

      {/* ================= NEW PAGE BUILDER ================= */}
      {mode === "new" && (
        <>
          <button
            onClick={() => setMode("pages")}
            className="mb-3 border px-3 py-1 rounded text-sm"
          >
            ← Back to Pages
          </button>

          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={i} className="border rounded p-2">
                <img
                  src={img.src}
                  onClick={() => {
                    setCropSrc(img.src);
                    setCropIndex(i);
                  }}
                  className="h-32 w-full object-cover rounded cursor-pointer"
                />

                <label className="flex items-center gap-2 mt-1 text-xs">
                  <input
                    type="checkbox"
                    checked={img.selected}
                    onChange={() => toggleSelected(i)}
                  />
                  Include
                </label>
<input
  type="text"
  placeholder="Image title"
  value={img.title}
  onChange={(e) =>
    setImages((prev) =>
      prev.map((p, idx) =>
        idx === i ? { ...p, title: e.target.value } : p
      )
    )
  }
  className="mt-1 w-full border rounded px-2 py-1 text-xs"
/>

                <div className="flex gap-1 flex-wrap mt-1">
                  {PRINT_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changePrintSize(i, s)}
                      className={`px-2 py-1 text-xs border rounded ${
                        img.printSize === s
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={images.filter((i) => i.selected).length === 0}
            onClick={() =>
              navigate(`/docpreview/${caseId}`, {
                state: {
                  images: images.filter((i) => i.selected),
                },
              })
            }
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50"
          >
            Preview & Print →
          </button>
        </>
      )}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          mode="a4"
          onSave={onCropSave}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
