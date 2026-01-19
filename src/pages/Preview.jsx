import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc,getDoc, setDoc } from "firebase/firestore";
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

const FOOTER_HEIGHT_MM = 15; // reserved space for footer (mm)

export default function Preview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [footerText, setFooterText] = useState(state?.footerText || "");
const [uniqId, setUniqId] = useState(
  state?.uniqId || `DOC-${Date.now()}`
);


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
    const caseRef = doc(db, "cases", caseId);
    const snap = await getDoc(caseRef);

    const existingDocs = snap.data()?.documents || [];
    const updatedDocs = [...existingDocs];

    for (const img of state.images) {

      // 1️⃣ RAW IMAGE → always upload & new doc
      if (img.source === "raw") {
        const imageUrl = await uploadToCloudinary(img.src, `documents/${caseId}`);

        updatedDocs.push({
          id: crypto.randomUUID(),
          imageUrl,
          title: img.title || "",
          printSize: img.printSize,
          createdAt: new Date(),
        });
      }

      // 2️⃣ FIRESTORE IMAGE
      if (img.source === "firestore") {

        // ask user only if modified
        if (img.isModified) {
          const replace = window.confirm(
            "This document already exists.\n\nOK = Replace\nCancel = Save as new"
          );

          // upload only if replaced
          const imageUrl = replace
            ? await uploadToCloudinary(img.src, `documents/${caseId}`)
            : img.imageUrl;

          if (replace) {
            // remove old
            const index = updatedDocs.findIndex(d => d.id === img.docId);
            if (index !== -1) updatedDocs.splice(index, 1);
          }

          updatedDocs.push({
            id: replace ? img.docId : crypto.randomUUID(),
            imageUrl,
            title: img.title || "",
            printSize: img.printSize,
            createdAt: new Date(),
          });
        }
      }
    }

    await setDoc(
      caseRef,
      { documents: updatedDocs, updatedAt: new Date() },
      { merge: true }
    );

    alert("Documents saved successfully ✅");
  } catch (err) {
    console.error(err);
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
<div className="mb-4 print:hidden">
  <label className="text-sm font-medium">
    Footer Text (will print on every page)
  </label>
  <textarea
    className="w-full border rounded p-2 text-sm"
    rows={2}
    value={footerText}
    onChange={(e) => setFooterText(e.target.value)}
    placeholder="Example: Valuation report – confidential"
  />
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
     position: "relative", 
    pageBreakAfter: "always",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "repeat(6, 1fr)",
      gap: "4mm",
      height: `calc(297mm - 20mm - ${FOOTER_HEIGHT_MM}mm)`,

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
    height: img.title ? "calc(100% - 14px)" : "100%",
    objectFit: "contain",
    display: "block",
  }}
/>

{img.title && (
  <div
    style={{
      fontSize: "10px",
      textAlign: "center",
      lineHeight: "12px",
      marginTop: "2px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {img.title}
  </div>
)}

        </div>
      );
    })}
  </div>
{footerText && (
  <div
    style={{
      position: "absolute",
      bottom: "10mm",
      left: "10mm",
      right: "10mm",
      textAlign: "center",
      fontSize: "10px",
      color: "#555",
      borderTop: "1px solid #ccc",
      paddingTop: "3mm",
      height: `${FOOTER_HEIGHT_MM}mm`,
      boxSizing: "border-box",
    }}
  >
    {footerText}
  </div>
)}


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
  style={{
    width: "100%",
    height: img.title ? "calc(100% - 14px)" : "100%",
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
