import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import CropModal from "../components/CropModal";
import CaseNavbar from "../components/CaseNavbar";

/* allowed print sizes */
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
  const location = useLocation();

  /* ------------------ STATE ------------------ */
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [rawDocs, setRawDocs] = useState([]);
  const [showRawPics, setShowRawPics] = useState(false);

  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  /* ------------------ LOAD CASE ------------------ */
  useEffect(() => {
    async function loadCase() {

      // 🔁 Coming back from preview
      if (location.state?.images) {
        setDocs(location.state.images);
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data() || {};

      const loadedDocs = [];
      const loadedRaw = [];

      // 1️⃣ Saved documents (priority)
      if (data.documents?.length) {
        for (const d of data.documents) {
          const base64 = await urlToBase64(d.imageUrl);
          loadedDocs.push({
            src: base64,
            title: d.title || "",
            printSize: d.printSize,
            selected: true,
            source: "saved",
          });
        }
      }

      // 2️⃣ Raw pics
      if (data.rowPics?.length) {
        for (const r of data.rowPics) {
          const base64 = await urlToBase64(r.imageUrl);
          loadedRaw.push({
            src: base64,
            title: "",
            printSize: null,
            selected: false,
            source: "raw",
          });
        }
      }

      setDocs(loadedDocs);
      setRawDocs(loadedRaw);

      // show raw automatically if no saved docs
      setShowRawPics(loadedDocs.length === 0);
      setLoading(false);
    }

    loadCase();
  }, [caseId]);

  if (loading) {
    return <div className="p-6 text-center">Loading documents…</div>;
  }

  /* ------------------ HELPERS ------------------ */
 const showRawPictures = () => {
  setDocs(prev => [...prev, ...rawDocs]);
  setRawDocs([]);        // 🔥 remove rawDocs from separate state
  setShowRawPics(true);
};


  const toggleSelected = (index) => {
    setDocs((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, selected: !d.selected } : d
      )
    );
  };

  const changePrintSize = (index, size) => {
    setDocs((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, printSize: size, selected: true }
          : d
      )
    );
  };

  const removeImage = (index) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const onCropSave = (croppedBase64) => {
    setDocs((prev) =>
      prev.map((d, i) =>
        i === cropIndex ? { ...d, src: croppedBase64 } : d
      )
    );
    setCropSrc(null);
    setCropIndex(null);
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="p-4 max-w-md mx-auto">
      <CaseNavbar />

      <h2 className="text-lg font-semibold mb-3">
        Prepare Documents
      </h2>

      {/* SHOW RAW PICS BUTTON */}
     {docs.length > 0 && rawDocs.length > 0 && !showRawPics && (
  <button
    onClick={showRawPictures}
    className="mb-3 px-4 py-2 border rounded text-sm"
  >
    Show Raw Pics
  </button>
)}

      {/* IMAGE GRID */}
      <div className="grid grid-cols-2 gap-3">
        {docs.map((doc, i) => (
          <div key={i} className="border rounded p-2 relative">

            {/* IMAGE */}
            <img
              src={doc.src}
              onClick={() => {
                setCropSrc(doc.src);
                setCropIndex(i);
              }}
              className="h-32 w-full object-cover rounded cursor-pointer"
            />

            {/* REMOVE */}
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full text-xs"
            >
              ✕
            </button>

            {/* TITLE */}
            <input
              type="text"
              placeholder="Document title"
              value={doc.title}
              onChange={(e) =>
                setDocs((prev) =>
                  prev.map((d, idx) =>
                    idx === i
                      ? { ...d, title: e.target.value }
                      : d
                  )
                )
              }
              className="w-full border rounded px-2 py-1 text-xs mt-1"
            />

            {/* CHECKBOX */}
            <label className="flex items-center gap-2 mt-1 text-xs">
              <input
                type="checkbox"
                checked={doc.selected}
                onChange={() => toggleSelected(i)}
              />
              Include in print
            </label>

            {/* PRINT SIZE */}
            <div className="mt-2">
              <div className="text-xs mb-1">Print size</div>
              <div className="flex gap-1 flex-wrap">
                {PRINT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => changePrintSize(i, size)}
                    className={`px-2 py-1 text-xs border rounded ${
                      doc.printSize === size
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate(`/case/${caseId}`)}
          className="flex-1 border rounded-lg py-3"
        >
          ← Back
        </button>

        <button
          disabled={docs.filter((d) => d.selected).length === 0}
          onClick={() =>
            navigate("/docpreview/${caseId}", {
              state: {
                images: docs.filter((d) => d.selected),
              },
            })
          }
          className="flex-1 bg-blue-600 text-white rounded-lg py-3 disabled:opacity-50"
        >
          Preview & Print →
        </button>
      </div>

      {/* CROP MODAL */}
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
