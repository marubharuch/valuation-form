import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { useState } from "react";

/* page usage per printSize */
const SIZE_TO_FRACTION = {
  1: 1,
  2: 0.5,
  3: 1 / 3,
  4: 0.25,
  6: 1 / 6,
};
const SIZE_SPAN = {
  1: { col: 2, row: 6 }, // full A4
  2: { col: 2, row: 3 }, // vertical half
  3: { col: 2, row: 2 }, // 33% height
  4: { col: 1, row: 3 }, // half width + half height
  6: { col: 1, row: 2 }, // half width + 1/3 height
};


export default function Preview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  // 🚨 HARD GUARD
  if (!caseId) {
    return (
      <div className="p-4 text-red-600">
        Invalid Case ID. Please go back and retry.
      </div>
    );
  }

  const images = (state?.images || []).filter(
    img => typeof img?.src === "string" && img.src.startsWith("data:image")
  );

  const [saving, setSaving] = useState(false);

  /* ------------------ PACK IMAGES INTO PAGES ------------------ */
  const pages = [];
  let currentPage = [];
  let usedCapacity = 0;

  images.forEach(img => {
    const usage = SIZE_TO_FRACTION[img.printSize];
    if (usedCapacity + usage > 1) {
      pages.push(currentPage);
      currentPage = [];
      usedCapacity = 0;
    }
    currentPage.push(img);
    usedCapacity += usage;
  });

  if (currentPage.length) pages.push(currentPage);

  /* ------------------ SAVE TO FIRESTORE ------------------ */
  const saveDocuments = async () => {
  if (saving) return;
  setSaving(true);

  try {
    const savedDocs = [];

    for (const img of images) {
      const base64 = getBase64(img);
      if (typeof base64 !== "string") continue;

      const imageUrl = await uploadToCloudinary(
        base64,
        `documents/${caseId}`
      );

      savedDocs.push({
        id: crypto.randomUUID(),
        imageUrl,
        title: img.title || "",
        printSize: img.printSize,
        createdAt: new Date(),
      });
    }

    if (!savedDocs.length) {
      alert("No valid images to save");
      return;
    }

    await setDoc(
      doc(db, "cases", caseId),
      {
        documents: savedDocs,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    alert("Documents saved successfully ✅");
  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save documents");
  } finally {
    setSaving(false);
  }
};
const printOnly = () => {
  window.print();
};



  function getBase64(img) {
    if (!img || typeof img !== "object") return null;
    if (typeof img.src === "string" && img.src.startsWith("data:image")) {
      return img.src;
    }
    return null;
  }

  /* ------------------ UI ------------------ */
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-4 print:hidden">
  <button
    onClick={() => navigate(-1, { state: { images } })}
    className="border px-4 py-2 rounded"
  >
    ← Back
  </button>

  <div className="flex gap-2">
    <button
      onClick={saveDocuments}
      disabled={saving}
      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {saving ? "Saving…" : "Save"}
    </button>

    <button
      onClick={printOnly}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Print
    </button>
  </div>
</div>


        {/* A4 PAGES */}
        {pages.map((page, pageIndex) => {
          const rows = buildRows(page);

          return (
            <div
  key={pageIndex}
  className="bg-white shadow mb-6 print:shadow-none"
  style={{
    width: "210mm",
    height: "297mm",
    padding: "10mm",
    boxSizing: "border-box",
    pageBreakAfter: "always",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "repeat(6, 1fr)",
      gap: "4mm",
      height: "100%",
    }}
  >
    {page.map((img, i) => {
      const span = SIZE_SPAN[img.printSize];

      return (
        <div
          key={i}
          style={{
            gridColumn: `span ${span.col}`,
            gridRow: `span ${span.row}`,
            border: "1px solid #ddd",
            padding: "4px",
          }}
        >
          <img
            src={img.src}
            alt={img.title || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          {img.title && (
            <div className="text-xs text-center mt-1">
              {img.title}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

          );
        })}
      </div>
    </div>
  );
}

/* ------------------ BUILD ROWS ------------------ */
function buildRows(images) {
  const rows = [];
  let buffer = [];

  images.forEach(img => {
    if (img.printSize === 2) {
      rows.push([img]);
    } else if (img.printSize === 4) {
      buffer.push(img);
      if (buffer.length === 2) {
        rows.push([...buffer]);
        buffer = [];
      }
    } else {
      rows.push([img]);
    }
  });

  if (buffer.length) rows.push([...buffer]);
  return rows;
}

/* ------------------ ROW BLOCK ------------------ */
function RowBlock({ row }) {
  const rowHeight = "148.5mm";

  return (
    <div style={{ height: rowHeight, display: "flex", width: "100%" }}>
      {row.map((img, i) => (
        <div
          key={i}
          style={{
            width: row.length === 1 ? "100%" : "50%",
            padding: "4px",
          }}
        >
          <img
            src={img.src}
            alt={img.title || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          {img.title && (
            <div className="text-xs text-center mt-1">
              {img.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
