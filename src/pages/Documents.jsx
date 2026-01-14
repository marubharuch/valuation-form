import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import { DOC_LAYOUTS } from "../utils/a4Layouts";
import CropModal from "../components/CropModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import CaseNavbar from "../components/CaseNavbar";

export default function Documents() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 local-only base64 images (never saved to Firestore)
  const [localDocs, setLocalDocs] = useState([]);

  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ------------------ LOAD CASE ------------------ */
  useEffect(() => {
    async function loadCase() {
      const snap = await getDoc(doc(db, "cases", caseId));
      setCaseData(snap.data());
      setLoading(false);
    }
    loadCase();
  }, [caseId]);

  if (loading || !caseData) {
    return <div className="p-6 text-center">Loading documents…</div>;
  }

  /* ------------------ FILE SELECT (LOCAL ONLY) ------------------ */
  const onSelect = (e) => {
    const files = [...e.target.files];
    e.target.value = null;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setLocalDocs((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  /* ------------------ REMOVE UPLOADED IMAGE ------------------ */
  const removeUploadedDoc = async (index) => {
    const updated = caseData.documents.filter((_, i) => i !== index);

    await updateDoc(doc(db, "cases", caseId), {
      documents: updated,
    });

    setCaseData({ ...caseData, documents: updated });
  };

  /* ------------------ UPLOAD ALL LOCAL IMAGES ------------------ */
  const uploadAllLocalDocs = async () => {
    if (localDocs.length === 0) return;

    setUploading(true);

    const uploadedUrls = [];

    for (const base64 of localDocs) {
      const url = await uploadToCloudinary(base64);
      uploadedUrls.push(url);
    }

    const updatedDocs = [...caseData.documents, ...uploadedUrls];

    await updateDoc(doc(db, "cases", caseId), {
      documents: updatedDocs,
    });

    setCaseData({ ...caseData, documents: updatedDocs });
    setLocalDocs([]);
    setUploading(false);
  };

  /* ------------------ SAVE SINGLE CROPPED IMAGE ------------------ */
  const onCropSave = async (croppedBase64) => {
    setUploading(true);

    const imageUrl = await uploadToCloudinary(croppedBase64);

    const updatedDocs = [...caseData.documents, imageUrl];

    await updateDoc(doc(db, "cases", caseId), {
      documents: updatedDocs,
    });

    setCaseData({ ...caseData, documents: updatedDocs });

    // remove from local buffer
    setLocalDocs((prev) => prev.filter((_, i) => i !== cropIndex));

    setCropSrc(null);
    setCropIndex(null);
    setUploading(false);
  };

  const layout = DOC_LAYOUTS[caseData.documentsPerPage];

  /* ------------------ UI ------------------ */
  return (
    <div className="p-4 max-w-md mx-auto">
      <CaseNavbar/>
      <h2 className="text-lg font-semibold mb-2">Upload Documents</h2>

      {/* Layout selector */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          Documents per A4 page
        </div>

        <div className="flex gap-2">
          {[1, 2, 4].map((n) => (
            <button
              key={n}
              onClick={async () => {
                await updateDoc(doc(db, "cases", caseId), {
                  documentsPerPage: n,
                });
                setCaseData({ ...caseData, documentsPerPage: n });
              }}
              className={`px-3 py-2 rounded border text-sm ${
                caseData.documentsPerPage === n
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onSelect}
        className="mb-4"
      />

      {/* PREVIEW GRID */}
      <div className="grid grid-cols-3 gap-2">
        {/* Uploaded (Cloudinary URLs) */}
        {caseData.documents.map((img, i) => (
          <div key={`u-${i}`} className="relative">
            <img
              src={img}
              className="h-24 w-full object-cover rounded"
            />
            <button
              onClick={() => removeUploadedDoc(i)}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Local (base64, not uploaded yet) */}
        {localDocs.map((img, i) => (
          <div key={`l-${i}`} className="relative">
            <img
              src={img}
              onClick={() => {
                setCropSrc(img);
                setCropIndex(i);
              }}
              className="h-24 w-full object-cover rounded cursor-pointer ring-2 ring-blue-400"
            />
          </div>
        ))}
      </div>

      {/* UPLOAD ALL BUTTON */}
      {localDocs.length > 0 && (
        <button
          onClick={uploadAllLocalDocs}
          disabled={uploading}
          className="w-full mt-4 bg-green-600 text-white py-2 rounded disabled:opacity-50"
        >
          {uploading
            ? "Uploading…"
            : `Upload ${localDocs.length} Images`}
        </button>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate(`/case/${caseId}`)}
          className="flex-1 border rounded-lg py-3"
        >
          ← Back
        </button>

        <button
          onClick={() => navigate(`/case/${caseId}/preview`,{
  state: { mode: "documents" }
})}
          disabled={uploading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-3 disabled:opacity-50"
        >
          Preview →
        </button>
      </div>

      {/* Crop modal */}
      {cropSrc && (
      <CropModal
  src={cropSrc}
  mode="a4"
  layout={layoutKey}   // 1,2,4 etc (same as before)
  onSave={onCropSave}
  onClose={() => setCropSrc(null)}
/>
      )}
    </div>
  );
}
