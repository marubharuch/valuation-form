import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CropModal from "../components/CropModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { urlToBase64 } from "../utils/urlToBase64";
import CaseNavbar from "../components/CaseNavbar";

/* ---------------- META FIELD CONFIG ---------------- */
const ROWPIC_FIELDS = [
  { key: "name", label: "Name", icon: "👤", type: "text" },
  { key: "mobile", label: "Mobile", icon: "📱", type: "tel" },
  { key: "address", label: "Address", icon: "🏠", type: "textarea" },
  {
    key: "docType",
    label: "Document Type",
    icon: "📄",
    type: "select",
    options: ["Sale Deed", "Tax Bill", "Agreement", "Other"],
  },
  { key: "floor", label: "Floor", icon: "🏢", type: "text" },
  { key: "construction", label: "Construction", icon: "🧱", type: "text" },
];

export default function RowPics() {
  const { caseId } = useParams();
  const fileRef = useRef();
  const multiRef = useRef();

  /* ---------------- STATE ---------------- */
  const [rowPics, setRowPics] = useState([]);
  const [metaForm, setMetaForm] = useState({});
  const [loading, setLoading] = useState(true);

  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [viewerPic, setViewerPic] = useState(null);
  const [activeField, setActiveField] = useState(null);

  const [pendingImages, setPendingImages] = useState([]);
  const [savingBatch, setSavingBatch] = useState(false);

  /* ---------------- CLOUDINARY FOLDER ---------------- */
  const now = new Date();
  const folder = `rawpics/${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function loadCase() {
      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data();
      setRowPics(data?.rowPics || []);
      setMetaForm(data?.rowPicMeta || {});
      setLoading(false);
    }
    loadCase();
  }, [caseId]);

  if (loading) {
    return <div className="p-6 text-center">Loading Row Pics…</div>;
  }

  /* ---------------- META ---------------- */
  const updateValue = (key, value) => {
    setMetaForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveMeta = async () => {
    await updateDoc(doc(db, "cases", caseId), {
      rowPicMeta: metaForm,
    });
    alert("Details saved");
  };

  /* ---------------- SINGLE CAPTURE ---------------- */
  const onCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const onCropSave = async (croppedBase64) => {
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(croppedBase64, folder);
      const updated = [...rowPics, { id: crypto.randomUUID(), imageUrl }];

      await updateDoc(doc(db, "cases", caseId), { rowPics: updated });
      setRowPics(updated);
      setCropSrc(null);
    } catch {
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- MULTI CAPTURE ---------------- */
  const onMultiCapture = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const mapped = files.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...mapped]);
    e.target.value = null;
  };

  /* ---------------- SAVE MULTIPLE ---------------- */
  const saveMultipleImages = async () => {
    if (!pendingImages.length) return;
    setSavingBatch(true);

    try {
      const uploaded = [];

      for (const img of pendingImages) {
        const base64 = await urlToBase64(img.preview);
        const imageUrl = await uploadToCloudinary(base64, folder);

        uploaded.push({
          id: crypto.randomUUID(),
          imageUrl,
        });

        URL.revokeObjectURL(img.preview);
      }

      const updatedRowPics = [...rowPics, ...uploaded];
      await updateDoc(doc(db, "cases", caseId), {
        rowPics: updatedRowPics,
      });

      setRowPics(updatedRowPics);
      setPendingImages([]);
    } catch (e) {
      console.error(e);
      alert("Failed to upload images");
    } finally {
      setSavingBatch(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <CaseNavbar />

      {/* META FORM */}
      <div className="mb-4 p-3 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-2 gap-3">
          {ROWPIC_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-600">
                {f.icon} {f.label}
              </label>

              {f.type === "textarea" ? (
                <textarea
                  rows={2}
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                >
                  <option value="">Select</option>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={saveMeta}
          className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Save Details
        </button>
      </div>

      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <button
          onClick={() => multiRef.current.click()}
          className="px-4 h-10 bg-green-600 text-white rounded"
        >
          Add Images
        </button>
        <button
          onClick={() => fileRef.current.click()}
          className="w-10 h-10 bg-blue-600 text-white rounded-full"
        >
          +
        </button>
      </div>

      <input ref={fileRef} type="file" hidden accept="image/*" capture="environment" onChange={onCapture} />
      <input ref={multiRef} type="file" hidden accept="image/*" multiple onChange={onMultiCapture} />

      {/* EXISTING IMAGES */}
      <div className="grid grid-cols-3 gap-2">
        {rowPics.map((pic) => (
          <img
            key={pic.id}
            src={pic.imageUrl}
            className="h-24 w-full object-cover rounded"
            onClick={() => setViewerPic(pic)}
          />
        ))}
      </div>

      {/* PENDING IMAGES */}
      {pendingImages.length > 0 && (
        <>
          <h4 className="mt-4 text-sm font-semibold">Pending Images</h4>
          <div className="grid grid-cols-3 gap-2">
            {pendingImages.map((img) => (
              <div key={img.id} className="relative">
                <img src={img.preview} className="h-24 w-full object-cover rounded" />
                <button
                  onClick={() =>
                    setPendingImages((p) => p.filter((x) => x.id !== img.id))
                  }
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={saveMultipleImages}
            disabled={savingBatch}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
          >
            {savingBatch ? "Saving..." : "Save Images"}
          </button>
        </>
      )}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          mode="free"
          onSave={onCropSave}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
