import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("pendingReport");
  const [search, setSearch] = useState("");

  /* ---------------- FETCH CASES ---------------- */
  useEffect(() => {
    async function fetchCases() {
      const q = query(
        collection(db, "cases"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCases(list);
      setLoading(false);
    }

    fetchCases();
  }, []);

  /* ---------------- FILTER + SEARCH ---------------- */
  const filteredCases = cases.filter((c) => {
    const q = search.toLowerCase();

    const matchesSearch =
      !q ||
      c.caseNo?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.contactNo?.includes(q) ||
      c.branch?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.valuer?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filter === "pendingReport") {
      return !c.reportSubmittedDate;
    }

    if (filter === "paymentPending") {
      return c.reportSubmittedDate && !c.paymentReceivedDate;
    }

    if (filter === "thisMonth") {
      const d = c.createdAt?.toDate?.();
      if (!d) return false;
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    return true;
  });

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Cases Dashboard</h1>
        firebase-sgsbharuch,git-marubharuch,cloudinary-sgsbackup1
       {/* <button
          onClick={() => navigate("/case/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Case
        </button>*/}
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search case no, name, contact, branch, city…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-96 border p-2 rounded mb-3"
      />

      {/* FILTER BUTTONS */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          ["pendingReport", "Pending Report"],
          ["paymentPending", "Payment Pending"],
          ["thisMonth", "This Month"],
          ["all", "All"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-white border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-10">Loading cases…</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No matching cases
        </div>
      ) : (
        <>
          {/* ================= MOBILE CARDS ================= */}
          {/* ================= MOBILE COMPACT LIST ================= */}
<div className="md:hidden divide-y bg-white rounded shadow">
  {filteredCases.map((c) => (
    <div
      key={c.id}
      className="px-3 py-2 flex flex-col gap-1"
    > 
      {/* ROW 1 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
           <a href={`tel:${c.contactNo}`} title="Call">
                📞
              </a>
          <span className="font-mono font-semibold text-xs">
            {c.caseNo || "—"}
          </span>

          <span className="text-sm font-medium truncate">
            {c.name || "—"}
          </span>
        </div>

        <button
          onClick={() => navigate(`/case/${c.id}`)}
          className="text-blue-600 text-xs"
        >
          Open →
        </button>
      </div>

      {/* ROW 2 */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="truncate">
          {c.branch} • {c.city}
        </div>

        <div className="flex items-center gap-3">
          {c.contactNo && (
            <>
             
              <a
                href={`https://wa.me/91${c.contactNo}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
              >
                💬
              </a>
            </>
          )}
        </div>
      </div>

      {/* ROW 3 */}
      <div className="flex justify-between items-center text-xs">
        <span>
          ₹{c.paymentAmount || "—"}
        </span>

        <span className="text-gray-500">
          {c.paymentReceivedDate || ""}
        </span>
      </div>
    </div>
  ))}
</div>


          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block bg-white rounded shadow overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 text-sm font-semibold px-4 py-2">
              <div>SR No</div>
              <div>Name</div>
              <div>Branch</div>
              <div>Contact</div>
              <div>Payment</div>
              <div>Received</div>
              <div>Action</div>
            </div>

            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-7 gap-2 px-4 py-3 border-t items-center text-sm"
              >
                <div className="font-mono font-semibold">
                  {c.caseNo || "—"}
                </div>

                <div>{c.name || "—"}</div>

                <div>
                  {c.branch}
                  <div className="text-xs text-gray-500">
                    {c.city}
                  </div>
                </div>

                <div className="flex gap-3">
                  {c.contactNo ? (
                    <>
                      <a href={`tel:${c.contactNo}`}>📞</a>
                      <a
                        href={`https://wa.me/91${c.contactNo}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        💬
                      </a>
                    </>
                  ) : (
                    "—"
                  )}
                </div>

                <div>
                  {c.paymentAmount
                    ? `₹${c.paymentAmount}`
                    : "—"}
                </div>

                <div>
                  {c.paymentReceivedDate || "—"}
                </div>

                <div>
                  <button
                    onClick={() => navigate(`/case/${c.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
