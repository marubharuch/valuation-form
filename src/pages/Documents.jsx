import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CaseNavbar from "../components/CaseNavbar";
import { useCaseDocuments } from "../hooks/useCaseDocuments";
import { useGPSLocation } from "../hooks/useGPSLocation";

import PageList from "../components/documents/PageList";
import RawPicsPanel from "../components/documents/RawPicsPanel";
import NewPageEditor from "../components/documents/NewPageEditor";
import PropertyDocumentsCard from "../components/documents/PropertyDocumentsCard";
import CropModal from "../components/CropModal";

import { urlToBase64 } from "../utils/urlToBase64";
import { valuationSummarySchema } from "../schemas/valuationSummary.schema";

export default function Documents() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  /* ---------------- MODE ---------------- */
  const [mode, setMode] = useState("pages"); // pages | raw | new

  /* ---------------- CROP ---------------- */
  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [cropSize, setCropSize] = useState(1);

  /* ---------------- CLIPBOARD ---------------- */
  const [lastPastedImage, setLastPastedImage] = useState(null);
  const [thumbs, setThumbs] = useState({
    map: null,
    jantri: null,
    "99acres": null,
  });

  /* ---------------- DATA ---------------- */
  const {
    loading,
    pages,
    images,
    setImages,
    propertyLocation,
    locationText,
    setLocationText,
    saveLocation,
  } = useCaseDocuments(caseId);

  /* ---------------- GPS ---------------- */
  const { gpsBusy, gpsStep, capture } = useGPSLocation(saveLocation);

  /* ---------------- HANDLERS ---------------- */

  async function openSavedPage(page) {
    if (!page?.images?.length) {
      alert("No images found in this page");
      return;
    }

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
  }

  function handleManualLocation() {
    const parts = locationText.split(",").map((p) => p.trim());
    if (parts.length !== 2) return;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return;

    saveLocation({
      lat,
      lng,
      accuracy: null,
      source: "manual",
      capturedAt: Date.now(),
      text: `${lat}, ${lng}`,
    });
  }

  async function pasteFromClipboard(type) {
    try {
      const items = await navigator.clipboard.read();

      for (const item of items) {
        for (const mime of item.types) {
          if (mime.startsWith("image/")) {
            const blob = await item.getType(mime);
            const reader = new FileReader();

            reader.onload = () => {
              const base64 = reader.result;

              if (lastPastedImage === base64 && thumbs[type] === null) {
                const ok = window.confirm(
                  `Same image detected.\nUse it for ${type.toUpperCase()}?`
                );
                if (!ok) return;
              }

              setImages((prev) => [
                {
                  src: base64,
                  title: type,
                  printSize: 4,
                  selected: true,
                  source: type,
                  previewed: false,
                },
                ...prev.filter((img) => img.source !== type),
              ]);

              setThumbs((prev) => ({ ...prev, [type]: base64 }));
              setLastPastedImage(base64);
            };

            reader.readAsDataURL(blob);
            return;
          }
        }
      }

      alert("No image found in clipboard");
    } catch (err) {
      console.error(err);
    }
  }

  function handleEditImage(index) {
    setCropIndex(index);
    setCropSrc(images[index].src);
    setCropSize(images[index].printSize || 1);
  }

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <CaseNavbar />

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">

        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-4">
          <PropertyDocumentsCard
            gpsBusy={gpsBusy}
            gpsStep={gpsStep}
            onCaptureGPS={() => capture(propertyLocation)}
            locationText={locationText}
            setLocationText={setLocationText}
            onManualBlur={handleManualLocation}
            propertyLocation={propertyLocation}
            onPaste={pasteFromClipboard}
            thumbs={thumbs}
            onThumbClick={(type) => {
              const ok = window.confirm(
                `Delete ${type.toUpperCase()} image?`
              );
              if (!ok) return;

              setThumbs((prev) => ({ ...prev, [type]: null }));
              setImages((prev) =>
                prev.filter((img) => img.source !== type)
              );
            }}
            onUseForPage={() => {
              setImages((prev) =>
                prev.map((img) => ({
                  ...img,
                  selected: img.source !== "raw",
                }))
              );
              setMode("new");
            }}
          />

          <button
            onClick={() => setMode("new")}
            className="w-full border py-2 rounded"
          >
            + Create New Page
          </button>
          <button
  onClick={() =>
    navigate(`/case/${caseId}/data`, {
      state: { schemaId: "valuationSummary" },
    })
  }
  className="border px-3 py-2 rounded"
>
  Valuation Summary
</button>

        </div>

        {/* ===== RIGHT COLUMN (2 cols) ===== */}
        <div className="lg:col-span-2">
          {mode === "pages" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PageList pages={pages} onOpenPage={openSavedPage} />
            </div>
          )}

          {mode === "raw" && (
            <>
              <button
                onClick={() => setMode("pages")}
                className="mb-2 text-sm"
              >
                ← Back
              </button>
              <RawPicsPanel
                images={images}
                setImages={setImages}
                onCreatePage={() => setMode("new")}
              />
            </>
          )}

          {mode === "new" && (
            <NewPageEditor
              images={images}
              setImages={setImages}
              onBack={() => setMode("pages")}
              onEditImage={handleEditImage}
              onPreview={() => {
                setImages((prev) =>
                  prev.map((img) =>
                    img.selected ? { ...img, previewed: true } : img
                  )
                );

                navigate(`/docpreview/${caseId}`, {
                  state: {
                    images: images.filter((i) => i.selected),
                  },
                });
              }}
            />
          )}
        </div>
      </div>

      {/* ================= CROP MODAL ================= */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          printSize={cropSize}
          onClose={() => {
            setCropSrc(null);
            setCropIndex(null);
          }}
          onSave={(base64) => {
            setImages((prev) =>
              prev.map((img, i) =>
                i === cropIndex ? { ...img, src: base64 } : img
              )
            );
            setCropSrc(null);
            setCropIndex(null);
          }}
        />
      )}
    </div>
  );
}
