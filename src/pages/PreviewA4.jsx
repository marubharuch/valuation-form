import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import html2pdf from "html2pdf.js";

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

  const mode = location.state?.mode || "documents";

  /* ------------------ STATE ------------------ */
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);

  const [footerText, setFooterText] = useState("");
  const [pageTitles, setPageTitles] = useState({});
  const [captions, setCaptions] = useState({});
  const [imageFit, setImageFit] = useState("contain");
// contain | cover | natural | stretch

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
      setScale(containerWidth / 794); // A4 width px
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------ PDF EXPORT ------------------ */
  const exportPDF = () => {
    const element = document.getElementById("a4-preview-root");

    html2pdf()
      .set({
        margin: 0,
        filename: `Case_${caseId}_Documents.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  /* ------------------ LOADING ------------------ */
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
    return <div className="p-6 text-center">No images available</div>;
  }

  /* ------------------ PER PAGE ------------------ */
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

  const valuer = caseData.valuer?.toLowerCase();
  const showHeader = valuer === "k";

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-gray-300 print:bg-white">

      {/* TOP BAR */}
      <div className="print-hidden bg-white border-b p-3 flex flex-wrap gap-3 items-center justify-between">
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

        {/* PAGE TITLE */}
        <input
          value={pageTitles[pageIndex] || ""}
          onChange={(e) =>
            setPageTitles({
              ...pageTitles,
              [pageIndex]: e.target.value,
            })
          }
          placeholder={`Title for page ${pageIndex + 1}`}
          className="border px-2 py-1 text-sm w-56"
        />
      
        <button onClick={exportPDF}>Download PDF</button>
        <select
  value={imageFit}
  onChange={(e) => setImageFit(e.target.value)}
  className="border px-2 py-1 text-sm"
>
  <option value="contain">Fit Image</option>
  <option value="cover">Fill Box (Crop)</option>
  <option value="natural">Original Size</option>
  <option value="stretch">Stretch</option>
</select>

        <button onClick={() => window.print()}>Print</button>
      </div>

      {/* PREVIEW */}
      <div className="flex justify-center py-6 print:py-0">
        <div
          id="a4-preview-root"
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
            {showHeader && (
              <>
                <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
                  (NAME–KAUSHIK M. SHAH, B.E. (CIVIL), A.M.I.E., GOVT. APPROVED VALUER)
                </div>
                <div style={{ fontSize: "10pt", marginTop: "2px" }}>
                  (ADD–SIDDHGIRI, MANINAGAR, AHMEDABAD)
                </div>
              </>
            )}
          </div>

          {/* CONTENT */}
          <div style={{ height: "247mm" }} className="p-3 flex flex-col gap-2">

            {/* PAGE TITLE */}
            {pageTitles[pageIndex] && (
              <div className="text-center text-sm font-semibold">
                {pageTitles[pageIndex]}
              </div>
            )}

            {/* IMAGE GRID */}
            <div
              className={`grid ${gridCols} gap-2 flex-1`}
              style={{ gridTemplateRows: gridRowsStyle }}
            >
              {pageImages.map((img, i) => {
                const key = `${pageIndex}-${i}`;
                return (
                  <div
                    key={i}
                    className="border flex flex-col items-center justify-center p-1"
                  >
                    <img
  src={img}
  style={{
    width: "100%",
    height: imageFit === "natural" ? "auto" : "100%",
    objectFit:
      imageFit === "natural"
        ? "contain"
        : imageFit === "stretch"
        ? "fill"
        : imageFit,
  }}
/>


                    {/* CAPTION */}
                    <input
                      value={captions[key] || ""}
                      onChange={(e) =>
                        setCaptions({
                          ...captions,
                          [key]: e.target.value,
                        })
                      }
                      placeholder="Optional caption"
                      className="border-none outline-none text-xs text-center mt-1 w-full bg-transparent"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="border-t px-4 text-xs flex justify-between items-center"
            style={{ height: "20mm" }}
          >
            <span />
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
