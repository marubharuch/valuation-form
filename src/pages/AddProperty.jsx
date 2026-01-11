import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import CropModal from "../components/CropModal";
import CaseNavbar from "../components/CaseNavbar";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

export default function AddProperty() {
  const navigate = useNavigate();

  const { caseId } = useParams();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [localImages, setLocalImages] = useState([]);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "cases", caseId));
      setCaseData(snap.data());
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading || !caseData) {
    return <div className="p-6 text-center">Loading property…</div>;
  }

  /* ---------------- SELECT FILES (LOCAL) ---------------- */
  const onSelect = (e) => {
    const files = [...e.target.files];
    e.target.value = null;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setLocalImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  /* ---------------- SAVE CROPPED IMAGE ---------------- */
  const onCropSave = (dataUrl) => {
    setLocalImages((prev) =>
      prev.map((img, i) => (i === cropIndex ? dataUrl : img))
    );
    setCropSrc(null);
    setCropIndex(null);
  };

  /* ---------------- UPLOAD ALL ---------------- */
  const uploadAllImages = async () => {
    if (localImages.length === 0) return;

    setUploading(true);

    const uploaded = [];
    for (const img of localImages) {
      const url = await uploadToCloudinary(img);
      uploaded.push(url);
    }

    const updated = [
      ...(caseData.propertyImages || []),
      ...uploaded,
    ];

    await updateDoc(doc(db, "cases", caseId), {
      propertyImages: updated,
    });

    setCaseData({ ...caseData, propertyImages: updated });
    setLocalImages([]);
    setUploading(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-md mx-auto p-4 space-y-3">
      <CaseNavbar />

      <h2 className="text-lg font-semibold">
        Property Images
      </h2>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onSelect}
      />

      {/* PREVIEW GRID */}
      <div className="grid grid-cols-3 gap-2">
        {/* Uploaded */}
        {(caseData.propertyImages || []).map((img, i) => (
          <img
            key={`u-${i}`}
            src={img}
            className="h-24 object-cover rounded"
          />
        ))}

        {/* Local */}
        {localImages.map((img, i) => (
          <img
            key={`l-${i}`}
            src={img}
            onClick={() => {
              setCropSrc(img);
              setCropIndex(i);
            }}
            className="h-24 object-cover rounded cursor-pointer ring-2 ring-blue-400"
          />
        ))}
      </div>

      {localImages.length > 0 && (
        <button
          onClick={uploadAllImages}
          disabled={uploading}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          {uploading
            ? "Uploading..."
            : `Upload ${localImages.length} Images`}
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
    onClick={() => {
      if (localImages.length > 0) {
        alert("Please upload images before preview");
        return;
      }
      navigate(`/case/${caseId}/preview`,{
  state: { mode: "property" }
});
    }}
    disabled={uploading || (caseData.propertyImages || []).length === 0}
    className="flex-1 bg-blue-600 text-white rounded-lg py-3 disabled:opacity-50"
  >
    Preview →
  </button>
</div>


      {cropSrc && (
        <CropModal
          src={cropSrc}
          onSave={onCropSave}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
