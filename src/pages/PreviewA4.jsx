import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ------------------ UTIL ------------------ */
function splitIntoPages(images, perPage) {
  const pages = [];
  for (let i = 0; i < images.length; i += perPage) {
    pages.push(images.slice(i, i + perPage));
  }
  return pages;
}

export default function PreviewA4() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
const [footerText, setFooterText] = useState("");

  /* 🔑 PREVIEW MODE */
  const mode = location.state?.mode || "documents";

  /* ------------------ STATE ------------------ */
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);

  /* ------------------ LOAD CASE ------------------ */
  useEffect(() => {
    async function loadCase() {
      const snap = await getDoc(doc(db, "cases", caseId));
      setCaseData(snap.data());
      setLoading(false);
    }
    loadCase();
  }, [caseId]);

  /* ------------------ RESPONSIVE SCALE ------------------ */
  useEffect(() => {
    const handleResize = () => {
      const containerWidth = window.innerWidth * 0.95;
      setScale(containerWidth / 794); // A4 width
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------ LOADING STATES ------------------ */
  if (loading) {
    return <div className="p-6 text-center">Loading preview…</div>;
  }

  if (!caseData) {
    return <div className="p-6 text-center">No case data found</div>;
  }

  /* ------------------ IMAGE SOURCE ------------------ */
  const images =
    mode === "property"
      ? caseData.propertyImages || []
      : caseData.documents || [];

  if (images.length === 0) {
    return (
      <div className="p-6 text-center">
        No images available for preview
      </div>
    );
  }

  /* ------------------ PER PAGE (MODE AWARE) ------------------ */
  const perPage =
    mode === "property"
      ? caseData.imagesPerPage || 1
      : caseData.documentsPerPage || 1;

  const pages = splitIntoPages(images, perPage);
  const pageImages = pages[pageIndex] || [];

  const gridCols =
    perPage === 4 || perPage === 6 ? "grid-cols-2" : "grid-cols-1";

  const gridRowsStyle =
    perPage === 1
      ? "1fr"
      : perPage === 2
      ? "1fr 1fr"
      : perPage === 4
      ? "1fr 1fr"
      : "1fr 1fr 1fr";

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-gray-300 print:bg-white">
      {/* TOP BAR */}
      <div className="print-hidden bg-white border-b p-3 flex justify-between">
        <button
          onClick={() =>
            navigate(
              mode === "property"
                ? `/case/${caseId}/property`
                : `/case/${caseId}/documents`
            )
          }
        >
          ← Back
        </button>

        <button onClick={() => window.print()}>Print</button>
      </div>

      {/* PREVIEW */}
      <div className="flex justify-center py-6 print:py-0">
        <div
          className="a4-page bg-white shadow-xl print:shadow-none"
          style={{
            width: "210mm",
            height: "297mm",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {/* HEADER */}
      <div
  style={{
    height: "30mm",
    borderBottom: "2px solid black",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: '"Times New Roman", Times, serif',
    textAlign: "center",
  }}
>
  <div
    style={{
      fontSize: "11pt",
      fontWeight: "bold",
      lineHeight: "1.15",
      whiteSpace: "nowrap",
    }}
  >
    (NAME–KAUSHIK M. SHAH, B.E. (CIVIL), A.M.I.E., GOVT. APPROVED VALUER,
    REGI. NO. CAT.I/476)
  </div>

  <div
    style={{
      fontSize: "10pt",
      lineHeight: "1.15",
      marginTop: "2px",
      whiteSpace: "nowrap",
    }}
  >
    (ADD–SIDDHGIRI, 13, ANANT SOCIETY, OPP. DEVYANI SOC., RAMANNAGAR,
    MANINAGAR, AHMEDABAD)
  </div>
</div>



          {/* CONTENT */}
          <div
            className={`grid ${gridCols} gap-2 p-3`}
            style={{
              height: "247mm",
              gridTemplateRows: gridRowsStyle,
            }}
          >
            {pageImages.map((img, i) => (
              <div
                key={i}
                className="border overflow-hidden flex items-center justify-center"
              >
                <img
                  src={img}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>

          {/* FOOTER */}
{/* FOOTER */}
<div
  className="border-t px-4 text-xs flex justify-between items-center"
  style={{ height: "20mm" }}
>
  {/* Left side */}
  .

  {/* Right side – PRINT ONLY INPUT */}
  <input
    value={footerText}
    onChange={(e) => setFooterText(e.target.value)}
    placeholder="Page No / Ref"
    className="border-none outline-none bg-transparent text-right text-xs w-40"
  />
</div>


        </div>
      </div>

      {/* PAGE NAV */}
      <div className="print-hidden flex justify-center gap-4 pb-6">
        <button
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((p) => p - 1)}
          className="border px-4 py-2 rounded disabled:opacity-40"
        >
          ◀ Prev
        </button>

        <span>
          Page {pageIndex + 1} / {pages.length}
        </span>

        <button
          disabled={pageIndex === pages.length - 1}
          onClick={() => setPageIndex((p) => p + 1)}
          className="border px-4 py-2 rounded disabled:opacity-40"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
