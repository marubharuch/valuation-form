import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import CaseNavbar from "../components/CaseNavbar";
import { generateCaseNo } from "../utils/generateCaseNo";

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const isNewCase = !caseId;

  const [caseData, setCaseData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(isNewCase);
  const [showOptional, setShowOptional] = useState(!isNewCase);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(isNewCase);

  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function loadCase() {
      if (isNewCase) {
        const initialData = {
          caseReceivedDate: new Date().toISOString().slice(0, 10),
          name: "",
          contactNo: "",
          city: "",
          route: "",
          valuer: "",
          branch: "",
          address: "",

          reportSubmittedDate: "",
          reopenCase: false,
          paymentMode: "",
          paymentReceivedDate: "",
          paymentAmount: "",
          receivedBy: "",
          reportBy: "",
          remarks: "",

          documents: [],
          propertyImages: [],
          documentsPerPage: 2,
          imagesPerPage: 6,
          status: "open",
        };

        setCaseData(initialData);
        setOriginalData(initialData);
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data();

      setCaseData(data);
      setOriginalData(data);
      setLoading(false);
    }

    loadCase();
  }, [caseId, isNewCase]);

  /* ---------------- FIELD UPDATE (DIRTY TRACKING) ---------------- */
  function updateField(key, value) {
    setCaseData((prev) => {
      const updated = { ...prev, [key]: value };
      setIsDirty(
        JSON.stringify(updated) !== JSON.stringify(originalData)
      );
      return updated;
    });
  }

  /* ---------------- SAVE ---------------- */
  async function saveCase() {
    if (!isDirty || isSaving) return;

    if (
      !caseData.name ||
      !caseData.contactNo ||
      !caseData.city ||
      !caseData.branch ||
      !caseData.address ||
      !caseData.valuer
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const status = caseData.reportSubmittedDate
        ? "completed"
        : "open";

      if (isNewCase) {
        const caseNo = await generateCaseNo(caseData.valuer);

        const ref = await addDoc(collection(db, "cases"), {
          ...caseData,
          caseNo,
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        navigate(`/case/${ref.id}/documents`);
      } else {
        await updateDoc(doc(db, "cases", caseId), {
          ...caseData,
          status,
          updatedAt: serverTimestamp(),
        });

        setOriginalData(caseData);
        setIsDirty(false);
        setEditMode(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || !caseData) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="p-3 max-w-6xl mx-auto">
      <CaseNavbar />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">
          Case Details {caseData.caseNo && `(${caseData.caseNo})`}
        </h2>

        {!isNewCase && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="text-blue-600 text-sm"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* CORE DETAILS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Field label="Name *" value={caseData.name} disabled={!editMode}
          onChange={(v) => updateField("name", v)} />

        <Field label="Contact No *" value={caseData.contactNo} disabled={!editMode}
          onChange={(v) => updateField("contactNo", v)} />

        <Field label="City *" value={caseData.city} disabled={!editMode}
          onChange={(v) => updateField("city", v)} />

        <Field label="Route" value={caseData.route} disabled={!editMode}
          onChange={(v) => updateField("route", v)} />

        <Field label="Valuer Code *" value={caseData.valuer} center disabled={!editMode}
          onChange={(v) =>
            updateField(
              "valuer",
              v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1)
            )
          } />

        <Field label="Branch *" value={caseData.branch} disabled={!editMode}
          onChange={(v) => updateField("branch", v)} />

        <TextArea label="Address *" value={caseData.address} disabled={!editMode}
          onChange={(v) => updateField("address", v)} />
      </div>

      {/* OPTIONAL / BILLING */}
      {!isNewCase && (
        <>
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="text-blue-600 text-sm mt-4"
          >
            {showOptional ? "− Hide Optional / Billing" : "+ Optional / Billing"}
          </button>

          {showOptional && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <div className="text-sm font-semibold mb-2">
                Optional / Billing Details
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Field
                  label="Payment Amount"
                  type="number"
                  value={caseData.paymentAmount}
                  onChange={(v) => updateField("paymentAmount", v)}
                />

                <Select
                  label="Payment Mode"
                  value={caseData.paymentMode}
                  options={["cash", "upi", "bank", "cheque"]}
                  onChange={(v) => updateField("paymentMode", v)}
                />

                <Field
                  label="Payment Received Date"
                  type="date"
                  value={caseData.paymentReceivedDate}
                  onChange={(v) =>
                    updateField("paymentReceivedDate", v)
                  }
                />

                <Field
                  label="Received By"
                  value={caseData.receivedBy}
                  onChange={(v) => updateField("receivedBy", v)}
                />

                <Field
                  label="Report Prepared By"
                  value={caseData.reportBy}
                  onChange={(v) => updateField("reportBy", v)}
                />

                <TextArea
                  label="Remarks"
                  value={caseData.remarks}
                  onChange={(v) => updateField("remarks", v)}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* SAVE BUTTON */}
      <button
        onClick={saveCase}
        disabled={!isDirty || isSaving}
        className={`w-full py-3 rounded mt-6 text-white
          ${!isDirty || isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600"}
        `}
      >
        {isSaving
          ? "Saving..."
          : isNewCase
          ? "Save & Next →"
          : "Save Changes"}
      </button>
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Label({ text }) {
  return <div className="text-xs text-gray-500 mb-1">{text}</div>;
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  center,
}) {
  return (
    <div>
      <Label text={label} />
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`border p-2 rounded w-full ${
          center ? "text-center font-bold" : ""
        }`}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, disabled }) {
  return (
    <div className="col-span-2 md:col-span-3 lg:col-span-4">
      <Label text={label} />
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 rounded w-full"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <Label text={label} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
