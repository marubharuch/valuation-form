import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import CropModal from "../components/CropModal";
import CaseNavbar from "../components/CaseNavbar";
import { captureAccurateLocation } from "../utils/captureAccurateLocation";

const PRINT_SIZES = [1, 2, 3, 4, 6];

const DEFAULT_TITLES = {
  map: "Location Map",
  jantri: "Jantri Screenshot",
  "99acres": "99acres Property",
};

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
  const [mode, setMode] = useState("pages"); // pages | new
  const [pages, setPages] = useState([]);
  const [images, setImages] = useState([]);

  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsStep, setGpsStep] = useState(0);
  const [propertyLocation, setPropertyLocation] = useState(null);
  const [locationText, setLocationText] = useState("");

  const [mapThumb, setMapThumb] = useState(null);

  const [pendingImage, setPendingImage] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [pasteType, setPasteType] = useState(null);

  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data() || {};

      setPages(data.documents?.pages || []);

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

  /* Restore map thumbnail from saved pages */
  useEffect(() => {
    if (!pages.length) return;
    const last = pages[pages.length - 1];
    const mapImg = last.images?.find((i) => i.source === "map");
    if (mapImg) setMapThumb(mapImg.imageUrl);
  }, [pages]);

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
        i === index ? { ...img, printSize: size, selected: true } : img
      )
    );
  };

  /* ---------------- CROP SAVE ---------------- */
  const onCropSave = (base64) => {
    // edit existing image
    if (cropIndex !== null) {
      setImages((prev) =>
        prev.map((img, i) =>
          i === cropIndex ? { ...img, src: base64 } : img
        )
      );
      setCropSrc(null);
      setCropIndex(null);
      return;
    }

    // new clipboard image
    setPendingImage(base64);
    setTitleInput(DEFAULT_TITLES[pasteType] || "");
    setCropSrc(null);
  };

  function savePendingImage(title) {
    setImages((prev) => [
      {
        src: pendingImage,
        title: title || DEFAULT_TITLES[pasteType],
        printSize: 4,
        selected: true,
        source: pasteType,
      },
      ...prev,
    ]);

    if (pasteType === "map") {
      setMapThumb(pendingImage);
    }

    setPendingImage(null);
    setPasteType(null);
  }

  /* ---------------- OPEN SAVED PAGE ---------------- */
  const openSavedPage = async (page) => {
    const convertedImages = await Promise.all(
      page.images.map(async (img) => ({
        ...img,
        src: await urlToBase64(img.imageUrl),
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

  /* ---------------- GPS ---------------- */
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
        propertyLocation: loc,
        propertyLocationText: loc.text,
      });

      setPropertyLocation(loc);
      setLocationText(loc.text);
    } finally {
      setGpsBusy(false);
      setGpsStep(0);
    }
  }

  function handleManualLocation() {
    const parts = locationText.split(",").map((p) => p.trim());
    if (parts.length !== 2) return;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return;

    const manual = {
      lat,
      lng,
      accuracy: null,
      capturedAt: Date.now(),
      source: "manual",
    };

    setPropertyLocation(manual);
    updateDoc(doc(db, "cases", caseId), {
      propertyLocation: manual,
      propertyLocationText: `${lat}, ${lng}`,
    });
  }

  function openGoogleMap(loc) {
    if (!loc?.lat || !loc?.lng) return;
    window.open(
      `https://www.google.com/maps?q=${loc.lat},${loc.lng}&t=k`,
      "_blank"
    );
  }

  /* ---------------- CLIPBOARD ---------------- */
  async function pasteFromClipboard(type) {
    if (type === "map" && mapThumb) {
      const ok = window.confirm(
        "A map image already exists.\nReplace it?"
      );
      if (!ok) return;

      setImages((prev) => prev.filter((i) => i.source !== "map"));
      setMapThumb(null);
    }

    setPasteType(type);
    setCropIndex(null);

    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const t of item.types) {
        if (t.startsWith("image/")) {
          const blob = await item.getType(t);
          const reader = new FileReader();
          reader.onload = () => setCropSrc(reader.result);
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <CaseNavbar />
      <h2 className="text-lg font-semibold mb-4">Documents</h2>

      {/* PROPERTY LOCATION */}
      <div className="mb-4 rounded border bg-gray-50 p-3">
        <div className="mb-2 text-sm font-medium">📍 Property Location</div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto_auto]">
          <button
            onClick={handleCaptureGPS}
            disabled={gpsBusy}
            className="h-10 rounded bg-blue-600 px-3 text-white"
          >
            {gpsBusy ? `Collecting ${gpsStep}/7` : "📍 Get"}
          </button>

          <input
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            onBlur={handleManualLocation}
            placeholder="Latitude, Longitude"
            className="h-10 rounded border px-2 text-sm"
          />

          <button
            onClick={() => openGoogleMap(propertyLocation)}
            disabled={!propertyLocation}
            className="h-10 rounded bg-green-600 px-3 text-white"
          >
            🗺 Map
          </button>

          <div className="flex gap-1">
            <button onClick={() => pasteFromClipboard("map")} className="bg-purple-600 px-2 text-white rounded">
              📋 Map
            </button>
            <button onClick={() => pasteFromClipboard("jantri")} className="bg-indigo-600 px-2 text-white rounded">
              📋 Jantri
            </button>
            <button onClick={() => pasteFromClipboard("99acres")} className="bg-pink-600 px-2 text-white rounded">
              📋 99acres
            </button>
          </div>
        </div>

        {mapThumb && (
          <div className="mt-3 flex gap-3 rounded border bg-white p-2">
            <img
              src={mapThumb}
              className="h-20 w-20 rounded object-cover cursor-pointer"
              onClick={() => setCropSrc(mapThumb)}
            />
            <div className="text-sm">Location Map Image</div>
          </div>
        )}
      </div>

      {/* PAGE LIST */}
      {mode === "pages" && (
        <>
          <button onClick={() => setMode("new")} className="mb-4 w-full border py-2">
            + Create New Page
          </button>

          {pages.map((p, i) => (
            <div key={p.pageId} onClick={() => openSavedPage(p)} className="mb-2 cursor-pointer border p-3">
              Page {i + 1} • {p.images.length} images
            </div>
          ))}
        </>
      )}

      {/* NEW PAGE */}
      {mode === "new" && (
        <>
          <button onClick={() => setMode("pages")} className="mb-3 text-sm">
            ← Back
          </button>

          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={i} className="border p-2">
                <img
                  src={img.src}
                  onClick={() => {
                    setCropIndex(i);
                    setCropSrc(img.src);
                  }}
                  className="h-32 w-full object-cover cursor-pointer"
                />

                <input
                  value={img.title}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, title: e.target.value } : p
                      )
                    )
                  }
                  placeholder="Image title"
                  className="mt-1 w-full border px-1 text-xs"
                />

                <label className="text-xs">
                  <input type="checkbox" checked={img.selected} onChange={() => toggleSelected(i)} /> Include
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              navigate(`/docpreview/${caseId}`, {
                state: { images: images.filter((i) => i.selected) },
              })
            }
            className="mt-6 w-full bg-blue-600 py-3 text-white"
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
          onClose={() => {
            setCropSrc(null);
            setPasteType(null);
          }}
        />
      )}

      {pendingImage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 w-80">
            <div className="mb-2 font-medium">Image title</div>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full border p-2"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => savePendingImage(titleInput || DEFAULT_TITLES[pasteType])}>
                Skip
              </button>
              <button onClick={() => savePendingImage(titleInput)} className="bg-blue-600 text-white px-3">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
