const HEADER_HEIGHT_MM = 20;
const FOOTER_HEIGHT_MM = 15;

export default function DataPagePreview({ page, showHeader }) {
  return (
    <div
      style={{
        width: "210mm",
        height: "297mm",
        padding: "10mm",
        boxSizing: "border-box",
        position: "relative",
        pageBreakAfter: "always",
        background: "#fff",
      }}
    >
      {/* HEADER */}
      {showHeader && (
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            height: `${HEADER_HEIGHT_MM}mm`,
            marginBottom: "4mm",
          }}
        >
          <div>
            (NAME – KAUSHIK M. SHAH B.E.(CIVIL) A.M.I.E.
            GOVT. APPROVED VALUER. REGI. NO CAT-I / 476)
          </div>
          <div style={{ marginTop: "2mm" }}>
            (ADD – SIDDHGIRI, 13, ANANT SOCIETY,
            OPP. DEVYANI SOC., MANINAGAR, AHMEDABAD)
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div
        style={{
          height: `calc(297mm - 20mm - ${
            showHeader ? HEADER_HEIGHT_MM : 0
          }mm - ${FOOTER_HEIGHT_MM}mm)`,
          overflow: "hidden",
        }}
      >
        {page.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: "6mm" }}>
            <div style={{ fontWeight: 600, marginBottom: "2mm" }}>
              {section.label}
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <tbody>
                {section.rows.map((row, r) => (
                  <tr key={r}>
                    <td
                      style={{
                        border: "1px solid #333",
                        padding: "4px",
                        width: "50%",
                      }}
                    >
                      {row.key}
                    </td>
                    <td
                      style={{
                        border: "1px solid #333",
                        padding: "4px",
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      {page.footerText && (
        <div
          style={{
            position: "absolute",
            bottom: "10mm",
            left: "10mm",
            right: "10mm",
            textAlign: "center",
            fontSize: "10px",
            borderTop: "1px solid #ccc",
            paddingTop: "3mm",
            height: `${FOOTER_HEIGHT_MM}mm`,
          }}
        >
          {page.footerText}
        </div>
      )}
    </div>
  );
}
