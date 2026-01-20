import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CaseNavbar from "../components/CaseNavbar";
import PropertyLocation from "../components/PropertyLocation";

import { useCaseDocuments } from "../hooks/useCaseDocuments";
import { useGPSLocation } from "../hooks/useGPSLocation";

/* these MUST exist or be created */
import PageList from "../components/documents/PageList";
import RawPicsPanel from "../components/documents/RawPicsPanel";
import ClipboardToolbar from "../components/documents/ClipboardToolbar";
import { urlToBase64 } from "../utils/urlToBase64";
import NewPageEditor from "../components/documents/NewPageEditor";
//import  pasteFromClipboard  from "../utils/pasteFromClipboard"; 
import PropertyDocumentsCard from "../components/documents/PropertyDocumentsCard";
import CropModal from "../components/CropModal";
export default function Documents() {
  const { caseId } = useParams();
  const navigate = useNavigate();
const [cropSrc, setCropSrc] = useState(null);
const [cropIndex, setCropIndex] = useState(null);


  /* ---------------- MODE ---------------- */
  const [mode, setMode] = useState("pages"); // pages | raw | new
const [lastPastedImage, setLastPastedImage] = useState(null);

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
  const [thumbs, setThumbs] = useState({
  map: null,
  jantri: null,
  "99acres": null,
});


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

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
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

            // 🔴 SAME IMAGE CHECK
            if (lastPastedImage === base64 && thumbs[type] === null) {
              const ok = window.confirm(
                `You are pasting the SAME image again.\n\nAre you sure this is for ${type.toUpperCase()}?`
              );
              if (!ok) return;
            }

            // replace image for this type
            setImages((prev) => [
              {
                src: base64,
                title: type,
                printSize: 4,
                selected: true,
                source: type,
              },
              ...prev.filter((img) => img.source !== type),
            ]);

            // update thumbnail
            setThumbs((prev) => ({
              ...prev,
              [type]: base64,
            }));

            // remember last pasted image
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
}

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <CaseNavbar />

      {/* -------- PROPERTY LOCATION -------- */}
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
  onThumbClick={(type, src) => {
  // DELETE
  if (src === null) {
    const ok = window.confirm(
      `Delete ${type.toUpperCase()} image?\n\nThis will remove the image from this page.`
    );

    if (!ok) return;

    // remove thumbnail
    setThumbs((prev) => ({
      ...prev,
      [type]: null,
    }));

    // remove image from memory
    setImages((prev) =>
      prev.filter((img) => img.source !== type)
    );

    return;
  }

  // future: re-crop
  console.log("Re-crop", type);
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


      {/* -------- CLIPBOARD -------- */}
     
      {/* -------- PAGES MODE -------- */}
      {mode === "new" && (
  <NewPageEditor
    images={images}
    setImages={setImages}
    onBack={() => setMode("pages")}
    onPreview={() =>
      navigate(`/docpreview/${caseId}`, {
        state: {
          images: images.filter((i) => i.selected),
        },
      })
    }
     onEditImage={handleEditImage}
  />
)}

      {mode === "pages" && (
        <>
          <button
            onClick={() => setMode("new")}
            className="mb-3 w-full border py-2"
          >
            + Create New Page
          </button>

          <PageList pages={pages} onOpenPage={openSavedPage} />

          <button
            onClick={() => setMode("raw")}
            className="mt-3 w-full border py-2"
          >
            Show Raw Pics
          </button>
        </>
      )}

      {/* -------- RAW MODE -------- */}
      {mode === "raw" && (
        <>
          <button onClick={() => setMode("pages")} className="mb-2 text-sm">
            ← Back
          </button>

          <RawPicsPanel
            images={images}
            setImages={setImages}
            onCreatePage={() => setMode("new")}
          />
        </>
      )}


{cropSrc && (
  <CropModal
    src={cropSrc}
    onClose={() => {
      setCropSrc(null);
      setCropIndex(null);
    }}
    onSave={(base64) => {
      // 🔴 THIS IS THE KEY PART
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

      {/* -------- LOCATION INFO -------- */}
      {/*propertyLocation && (
        <div className="mt-3 rounded border p-2 text-sm bg-gray-50">
          <div><b>Lat:</b> {propertyLocation.lat}</div>
          <div><b>Lng:</b> {propertyLocation.lng}</div>
          <div>
            <b>Accuracy:</b>{" "}
            {propertyLocation.accuracy
              ? `${propertyLocation.accuracy} m`
              : "—"}
          </div>
        </div>
      )*/}
    </div>
  );
}
