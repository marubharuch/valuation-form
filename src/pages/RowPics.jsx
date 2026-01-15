import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CropModal from "../components/CropModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

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

  /* ---------------- STATE ---------------- */
  const [rowPics, setRowPics] = useState([]);
  const [metaForm, setMetaForm] = useState({});
  const [loading, setLoading] = useState(true);

  const [cropSrc, setCropSrc] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [viewerPic, setViewerPic] = useState(null);
  const [activeField, setActiveField] = useState(null);

  /* ---------------- CLOUDINARY FOLDER ---------------- */
  const now = new Date();
  const folder = `rawpics/${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  /* ---------------- LOAD FROM FIRESTORE ---------------- */
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

  /* ---------------- LOCAL META UPDATE ---------------- */
  const updateValue = (key, value) => {
    setMetaForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------- SAVE META (EXPLICIT) ---------------- */
  const saveMeta = async () => {
    await updateDoc(doc(db, "cases", caseId), {
      rowPicMeta: metaForm,
    });
    alert("Details saved");
  };

  /* ---------------- CAMERA / FILE PICKER ---------------- */
  const onCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);

    e.target.value = null;
  };

  /* ---------------- SAVE IMAGE ---------------- */
  const onCropSave = async (croppedBase64) => {
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(croppedBase64, folder);

      const updated = [
        ...rowPics,
        { id: crypto.randomUUID(), imageUrl },
      ];

      await updateDoc(doc(db, "cases", caseId), {
        rowPics: updated,
      });

      setRowPics(updated);
      setCropSrc(null);
    } catch {
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">

      {/* ===== META INPUTS (TOP) ===== */}
      <div className="mb-4 p-3 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ROWPIC_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-600 mb-1 flex gap-1">
                <span>{f.icon}</span> {f.label}
              </label>

              {f.type === "textarea" ? (
                <textarea
                  rows={2}
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) =>
                    updateValue(f.key, e.target.value)
                  }
                />
              ) : f.type === "select" ? (
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) =>
                    updateValue(f.key, e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  className="w-full border rounded p-2 text-sm"
                  value={metaForm[f.key] || ""}
                  onChange={(e) =>
                    updateValue(f.key, e.target.value)
                  }
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

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Row Pics</h3>
        <button
          onClick={() => fileRef.current.click()}
          className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl"
        >
          +
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onCapture}
      />

      {/* ===== IMAGES ===== */}
      <div className="grid grid-cols-3 gap-2">
        {rowPics.map((pic) => (
          <img
            key={pic.id}
            src={pic.imageUrl}
            onClick={() => setViewerPic(pic)}
            className="h-24 w-full object-cover rounded cursor-pointer"
          />
        ))}
      </div>

      {/* ===== CROP MODAL ===== */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          mode="free"
          onSave={onCropSave}
          onClose={() => setCropSrc(null)}
        />
      )}

      {/* ===== IMAGE VIEWER (DATA ENTRY FROM IMAGE) ===== */}
      {viewerPic && (
        <div className="fixed inset-0 bg-black z-50">
          <img
            src={viewerPic.imageUrl}
            className="w-full h-full object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/60 px-4 py-2 rounded-full">
            {ROWPIC_FIELDS.map((f) => {
              const hasValue = !!metaForm[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveField(f)}
                  className="relative text-xl text-white"
                >
                  {f.icon}
                  {hasValue && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setViewerPic(null)}
              className="text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===== IMAGE-BASED INPUT ===== */}
      {activeField && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 rounded-t-xl z-50">
          <div className="font-semibold mb-2">
            {activeField.icon} {activeField.label}
          </div>

          {activeField.type === "textarea" ? (
            <textarea
              rows={3}
              className="w-full border rounded p-2"
              value={metaForm[activeField.key] || ""}
              onChange={(e) =>
                updateValue(activeField.key, e.target.value)
              }
            />
          ) : activeField.type === "select" ? (
            <select
              className="w-full border rounded p-2"
              value={metaForm[activeField.key] || ""}
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
              value={metaForm[activeField.key] || ""}
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
              Close
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
