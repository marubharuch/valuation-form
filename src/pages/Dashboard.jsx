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

  const [filter, setFilter] = useState("pendingReport"); // default
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

    // 🔹 Filters
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

        <button
          onClick={() => navigate("/case/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Case
        </button>
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
        <button
          onClick={() => setFilter("pendingReport")}
          className={`px-3 py-1 rounded text-sm ${
            filter === "pendingReport"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Pending Report
        </button>

        <button
          onClick={() => setFilter("paymentPending")}
          className={`px-3 py-1 rounded text-sm ${
            filter === "paymentPending"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          Payment Pending
        </button>

        <button
          onClick={() => setFilter("thisMonth")}
          className={`px-3 py-1 rounded text-sm ${
            filter === "thisMonth"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          This Month
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded text-sm ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          All
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-10">Loading cases…</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No matching cases
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          {/* TABLE HEADER (Desktop) */}
          <div className="hidden md:grid grid-cols-7 bg-gray-50 text-sm font-semibold px-4 py-2">
            <div>SR No</div>
            <div>Name</div>
            <div>Branch</div>
            <div>Contact</div>
            <div>Payment</div>
            <div>Received</div>
            <div>Action</div>
          </div>

          {/* ROWS */}
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-1 md:grid-cols-7 gap-2 px-4 py-3 border-t items-center text-sm"
            >
              {/* SR NO */}
              <div className="font-mono font-semibold">
                {c.caseNo || "—"}
              </div>

              {/* NAME */}
              <div>{c.name || "—"}</div>

              {/* BRANCH + CITY */}
              <div>
                {c.branch}
                <div className="text-xs text-gray-500">
                  {c.city}
                </div>
              </div>

              {/* CONTACT */}
              <div>{c.contactNo || "—"}</div>

              {/* PAYMENT */}
              <div>
                {c.paymentAmount
                  ? `₹${c.paymentAmount}`
                  : "—"}
              </div>

              {/* RECEIVED DATE */}
              <div>
                {c.paymentReceivedDate || "—"}
              </div>

              {/* ACTION */}
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
      )}
    </div>
  );
}
