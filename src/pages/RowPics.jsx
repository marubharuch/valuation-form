import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CropModal from "../components/CropModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

/* ---------------- FIELD CONFIG ---------------- */
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

  const [caseData, setCaseData] = useState(null);
  const [rowPics, setRowPics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [viewerPic, setViewerPic] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [form, setForm] = useState({});

  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function loadCase() {
      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data();
      setCaseData(data);
      setRowPics(data?.rowPics || []);
      setLoading(false);
    }
    loadCase();
  }, [caseId]);

  if (loading) {
    return <div className="p-6 text-center">Loading images…</div>;
  }

  /* ---------------- FILE SELECT (CAMERA / FILE PICKER) ---------------- */
  const onCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);

    e.target.value = null;
  };

  /* ---------------- SAVE CROPPED IMAGE ---------------- */
  const onCropSave = async (croppedBase64) => {
    if (!croppedBase64) return;

    setUploading(true);

    try {
      const imageUrl = await uploadToCloudinary(croppedBase64);

      if (!imageUrl) {
        alert("Upload failed");
        return;
      }

      const newPic = {
        id: crypto.randomUUID(),
        imageUrl,
        meta: {},
      };

      const updated = [...rowPics, newPic];

      await updateDoc(doc(db, "cases", caseId), {
        rowPics: updated,
      });

      setRowPics(updated);
      setCropSrc(null);
    } catch (err) {
      console.error("RowPic upload failed", err);
      alert("Failed to save image");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- SAVE META ---------------- */
  const saveMeta = async () => {
    if (!viewerPic) return;

    const updated = rowPics.map((p) =>
      p.id === viewerPic.id ? { ...p, meta: form } : p
    );

    await updateDoc(doc(db, "cases", caseId), {
      rowPics: updated,
    });

    setRowPics(updated);
    setActiveField(null);
  };

  /* ---------------- VIEWER ---------------- */
  const openViewer = (pic) => {
    setViewerPic(pic);
    setForm(pic.meta || {});
  };

  const updateValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mt-6 p-4 max-w-md mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Row Pics</h3>
        <button
          onClick={() => fileRef.current.click()}
          className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl"
        >
          +
        </button>
      </div>

      {/* FILE INPUT */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onCapture}
      />

      {/* THUMBNAILS */}
      <div className="grid grid-cols-3 gap-2">
        {rowPics.map((pic) => (
          <img
            key={pic.id}
            src={pic.imageUrl}
            onClick={() => openViewer(pic)}
            className="h-24 w-full object-cover rounded cursor-pointer"
          />
        ))}
      </div>

      {/* CROP MODAL */}
      {cropSrc && (
        <CropModal
  src={cropSrc}
  mode="free"
  onSave={onCropSave}
  onClose={() => setCropSrc(null)}
/>

      )}

      {/* FULLSCREEN VIEWER */}
      {viewerPic && (
        <div className="fixed inset-0 bg-black z-50">
          <img
            src={viewerPic.imageUrl}
            className="w-full h-full object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/60 px-4 py-2 rounded-full">
            {ROWPIC_FIELDS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveField(f)}
                className={`text-xl ${
                  viewerPic.meta?.[f.key] ? "opacity-100" : "opacity-60"
                }`}
              >
                {f.icon}
              </button>
            ))}
            <button
              onClick={() => setViewerPic(null)}
              className="text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* META INPUT */}
      {activeField && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 rounded-t-xl z-50">
          <div className="font-semibold mb-2">
            {activeField.icon} {activeField.label}
          </div>

          {activeField.type === "textarea" ? (
            <textarea
              rows={3}
              className="w-full border rounded p-2"
              value={form[activeField.key] || ""}
              onChange={(e) =>
                updateValue(activeField.key, e.target.value)
              }
            />
          ) : activeField.type === "select" ? (
            <select
              className="w-full border rounded p-2"
              value={form[activeField.key] || ""}
              onChange={(e) =>
                updateValue(activeField.key, e.target.value)
              }
            >
              <option value="">Select</option>
              {activeField.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={activeField.type}
              className="w-full border rounded p-2"
              value={form[activeField.key] || ""}
              onChange={(e) =>
                updateValue(activeField.key, e.target.value)
              }
            />
          )}

          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setActiveField(null)}
              className="flex-1 border rounded py-2"
            >
              Cancel
            </button>
            <button
              onClick={saveMeta}
              className="flex-1 bg-blue-600 text-white rounded py-2"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-sm text-center mt-3">Uploading…</div>
      )}
    </div>
  );
}
