
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, get } from "firebase/database";

import { rtdb } from "../firebase";
import DataPagePreview from "../components/documents/DataPagePreview";

export default function DataPreview({schema}) {
console.log("Rendering DataPreview");
    
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [dataPages, setDataPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!caseId) return;

      const snap = await get(ref(rtdb, `cases/${caseId}/dataPages`));
      const raw = snap.val() || {};

     const pages = Object.values(raw).map((page) => ({
  pageId: page.pageId || crypto.randomUUID(),
  valuer: page.valuer || "",
  footerText: page.footerText || "",
  sections: [
    {
      label: schema.title,
      rows: schema.fields.map(field => ({
        key: field.label.toUpperCase(),
        value: page.data?.[field.key] ?? "",
      })),
    },
  ],
}));


      setDataPages(pages);
      setLoading(false);
    }

    load();
  }, [caseId]);

  if (!caseId) {
    return <div className="p-4 text-red-600">Invalid Case ID</div>;
  }

  if (loading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-5xl mx-auto">

        {/* ACTION BAR */}
        <div className="flex justify-between mb-4 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded"
          >
            ← Back
          </button>

          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Print
          </button>
        </div>

        {dataPages.length === 0 && (
          <div className="text-center text-gray-500">
            No data pages found
          </div>
        )}

        {dataPages.map((page) => (
          <DataPagePreview
            key={page.pageId}
            page={page}
            showHeader={(page.valuer || "").toLowerCase() === "k"}
          />
        ))}
      </div>
    </div>
  );
}
