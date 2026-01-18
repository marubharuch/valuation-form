import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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

  /* ------------------ DATA FROM DOCUMENTS ------------------ */
  const images = location.state?.images || [];
  const perPage = location.state?.perPage || 1;

  /* ------------------ STATE ------------------ */
  const [scale, setScale] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageTitles, setPageTitles] = useState({});
  const [captions, setCaptions] = useState({});
  const [footerText, setFooterText] = useState("");
  const [imageFit, setImageFit] = useState("contain");

  if (!images.length) {
    return (
      <div className="p-6 text-center">
        No images received
        <br />
        <button onClick={() => navigate(-1)} className="underline mt-3">
          Go back
        </button>
      </div>
    );
  }

  /* ------------------ PAGINATION ------------------ */
  const pages = splitIntoPages(images, perPage);

  /* ------------------ RESPONSIVE SCALE ------------------ */
  useEffect(() => {
    const handleResize = () => {
      const containerWidth = window.innerWidth * 0.95;
      setScale(containerWidth / 794); // A4 px width
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------ GRID SETTINGS ------------------ */
  const gridCols =
    perPage === 4 || perPage === 6 ? "grid-cols-2" : "grid-cols-1";

 const gridRowsStyle =
  perPage === 1
    ? "minmax(0, 1fr)"
    : perPage === 2
    ? "repeat(2, minmax(0, 1fr))"
    : perPage === 3
    ? "repeat(3, minmax(0, 1fr))"
    : perPage === 4
    ? "repeat(2, minmax(0, 1fr))"
    : "repeat(3, minmax(0, 1fr))"; // for 6


  /* ------------------ PDF EXPORT ------------------ */
  const exportPDF = () => {
    const el = document.getElementById("a4-preview-root");

    html2pdf()
      .set({
        margin: 0,
        filename: `Case_${caseId}_Documents.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-gray-300 print:bg-white">

      {/* CONTROLS */}
      <div className="print-hidden bg-white border-b p-3 flex flex-wrap gap-3 justify-between items-center">
        <button onClick={() => navigate(-1)}>← Back</button>

        <input
          value={pageTitles[pageIndex] || ""}
          onChange={(e) =>
            setPageTitles({ ...pageTitles, [pageIndex]: e.target.value })
          }
          placeholder={`Title for page ${pageIndex + 1}`}
          className="border px-2 py-1 text-sm w-56"
        />

        <select
          value={imageFit}
          onChange={(e) => setImageFit(e.target.value)}
          className="border px-2 py-1 text-sm"
        >
          <option value="contain">Fit</option>
          <option value="cover">Cover</option>
          <option value="natural">Original</option>
          <option value="stretch">Stretch</option>
        </select>

        <button onClick={exportPDF}>Download PDF</button>
        <button onClick={() => window.print()}>Print</button>
      </div>

      {/* PREVIEW ROOT (ALL PAGES ALWAYS RENDERED) */}
      <div className="flex justify-center py-6 print:py-0">
        <div id="a4-preview-root" className="flex flex-col gap-10">

          {pages.map((pageImages, pIndex) => (
            <div
              key={pIndex}
              className={`a4-page bg-white shadow-xl print:shadow-none ${
                pIndex === pageIndex ? "" : "screen-hidden"
              }`}
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
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  fontFamily: "Times New Roman",
                }}
              >
                DOCUMENT PHOTOGRAPHS
              </div>

              {/* CONTENT */}
              <div style={{ height: "247mm" }} className="p-3 flex flex-col gap-2">
                {pageTitles[pIndex] && (
                  <div className="text-center text-sm font-semibold">
                    {pageTitles[pIndex]}
                  </div>
                )}

                <div
                  className={`grid ${gridCols} gap-2 flex-1`}
                  style={{ gridTemplateRows: gridRowsStyle }}
                >
                  {pageImages.map((img, i) => {
                    const key = `${pIndex}-${i}`;
                    return (
                      <div key={i} className="border flex flex-col p-1">
                        <img
                          src={img}
                          style={{
                            width: "100%",
                            height:
                              imageFit === "natural" ? "auto" : "100%",
                            objectFit:
                              imageFit === "natural"
                                ? "contain"
                                : imageFit === "stretch"
                                ? "fill"
                                : imageFit,
                          }}
                        />

                        <input
                          value={captions[key] || ""}
                          onChange={(e) =>
                            setCaptions({
                              ...captions,
                              [key]: e.target.value,
                            })
                          }
                          placeholder="Caption"
                          className="border-none outline-none text-xs text-center bg-transparent mt-1"
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
                <span>
                  Page {pIndex + 1} of {pages.length}
                </span>
                <input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Ref / Case No"
                  className="border-none outline-none bg-transparent text-right text-xs w-40"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAGE NAV */}
      <div className="print-hidden flex justify-center gap-4 pb-6">
        <button
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((p) => p - 1)}
          className="border px-4 py-2 rounded"
        >
          ◀ Prev
        </button>

        <span>
          Page {pageIndex + 1} / {pages.length}
        </span>

        <button
          disabled={pageIndex === pages.length - 1}
          onClick={() => setPageIndex((p) => p + 1)}
          className="border px-4 py-2 rounded"
        >
          Next ▶
        </button>
      </div>

      {/* CSS */}
      <style>{`
        .screen-hidden {
          display: none;
        }

        @media print {
          .print-hidden {
            display: none !important;
          }
          .screen-hidden {
            display: block !important;
          }
          .a4-page {
            transform: none !important;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
