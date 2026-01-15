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
  const [showOptional, setShowOptional] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(isNewCase);
  const [gpsBusy, setGpsBusy] = useState(false);
const [gpsStep, setGpsStep] = useState(0);


  /* ---------------- LOAD CASE ---------------- */
  useEffect(() => {
    async function loadCase() {
      if (isNewCase) {
        const initial = {
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
          propertyLocation: null,
propertyLocationText: "",

        };

        setCaseData(initial);
        setOriginalData(initial);
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

  /* ---------------- DIRTY TRACKING ---------------- */
  function updateField(key, value) {
    setCaseData((prev) => {
      const updated = { ...prev, [key]: value };
      setIsDirty(
        JSON.stringify(updated) !== JSON.stringify(originalData)
      );
      return updated;
    });
  }

  function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius (m)
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

 async function captureAccurateLocation() {
  // STEP 1: existing value confirmation
  if (caseData.propertyLocation) {
    const ok = window.confirm(
      "Location already exists.\nDo you want to recapture?"
    );
    if (!ok) return;
  }

  if (!navigator.geolocation) {
    alert("Location not supported");
    return;
  }

  setGpsBusy(true);
  setGpsStep(0);

  const TOTAL = 7;
  const readings = [];

  const getOnce = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  try {
    for (let i = 0; i < TOTAL; i++) {
      try {
        const r = await getOnce();
        readings.push(r);
        setGpsStep(i + 1);
      } catch {}
      await new Promise((r) => setTimeout(r, 1200));
    }

    const best = readings.reduce((a, b) =>
      a.accuracy < b.accuracy ? a : b
    );

    // STEP 2: distance difference check
    if (caseData.propertyLocation) {
      const old = caseData.propertyLocation;
      const dist = distanceInMeters(
        old.lat,
        old.lng,
        best.lat,
        best.lng
      );

      if (dist > 150) {
        const confirmFar = window.confirm(
          `New location is ${Math.round(
            dist
          )} meters away.\nReplace existing location?`
        );
        if (!confirmFar) return;
      }
    }

    updateField("propertyLocation", {
      ...best,
      capturedAt: Date.now(),
    });

    updateField(
      "propertyLocationText",
      `${best.lat.toFixed(6)}, ${best.lng.toFixed(
        6
      )} (±${best.accuracy.toFixed(1)}m)`
    );
  } finally {
    setGpsBusy(false);
    setGpsStep(0);
  }
}



function openGoogleMap() {
  if (!caseData.propertyLocation) return;

  const { lat, lng } = caseData.propertyLocation;
  window.open(
    `https://www.google.com/maps?q=${lat},${lng}&t=k`,
    "_blank"
  );
}

  /* ---------------- SAVE ---------------- */
  async function saveCase() {
    if (isSaving || !isDirty) return;

    // ✅ ONLY REQUIRED FIELDS
    if (!caseData.valuer || !caseData.branch) {
      alert("Valuer code and Branch are required");
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
            ✏️ Edit Core Details
          </button>
        )}
      </div>

      {/* CORE DETAILS (EDIT MODE CONTROLLED) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
       
        <Field
          label="Valuer Code *"
          value={caseData.valuer}
          disabled={!editMode}
          center
          onChange={(v) =>
            updateField(
              "valuer",
              v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1)
            )
          }
        />

        <Field
          label="Branch *"
          value={caseData.branch}
          disabled={!editMode}
          onChange={(v) => updateField("branch", v)}
        />
       
       
       
        <Field label="Name" value={caseData.name}
          disabled={!editMode}
          onChange={(v) => updateField("name", v)} />

        <Field label="Contact No" value={caseData.contactNo}
          disabled={!editMode}
          onChange={(v) => updateField("contactNo", v)} />

        <Field label="City" value={caseData.city}
          disabled={!editMode}
          onChange={(v) => updateField("city", v)} />

        <Field label="Route" value={caseData.route}
          disabled={!editMode}
          onChange={(v) => updateField("route", v)} />

       

        <TextArea
          label="Address"
          value={caseData.address}
          disabled={!editMode}
          onChange={(v) => updateField("address", v)}
        />
      </div>

      {/* OPTIONAL / BILLING (ALWAYS EDITABLE) */}
      <button
        onClick={() => setShowOptional(!showOptional)}
        className="text-blue-600 text-sm mt-4"
      >
        {showOptional
          ? "− Hide Optional / Billing"
          : "+ Optional / Billing"}
      </button>

      {showOptional && (
        <div className="mt-4 bg-gray-50 p-3 rounded">

      <div className="col-span-2 md:col-span-3 lg:col-span-4">
  <Label text="Property Location (GPS)" />

  <div className="flex gap-2">
    <input
      type="text"
      value={caseData.propertyLocationText || ""}
      readOnly
      placeholder="Latitude, Longitude will appear here"
      className="border p-2 rounded w-full bg-gray-100"
    />

    <button
  type="button"
  onClick={captureAccurateLocation}
  disabled={gpsBusy}
  className={`px-4 rounded text-white flex items-center gap-2
    ${gpsBusy ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"}
  `}
>
  {gpsBusy && (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )}
  {gpsBusy ? "Collecting…" : "📍 Get"}
</button>


    <button
      type="button"
      onClick={openGoogleMap}
      disabled={!caseData.propertyLocation}
      className={`px-4 rounded text-white
        ${
          caseData.propertyLocation
            ? "bg-green-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
    >
      🗺 Map
    </button>
  </div>

  {caseData.propertyLocation && (
    <div className="text-xs text-gray-500 mt-1">
      Accuracy: ±{caseData.propertyLocation.accuracy.toFixed(1)} m
    </div>
  )}
</div>


          <div className="text-sm font-semibold mb-2">
            Optional / Billing Details
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <Label text="Report Submitted Date" />
              <input
                type="date"
                value={caseData.reportSubmittedDate}
                onChange={(e) =>
                  updateField("reportSubmittedDate", e.target.value)
                }
                className="border p-2 rounded w-full"
              />
            </div>

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

      {/* SAVE */}
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
        value={value || ""}
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
        value={value || ""}
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
        value={value || ""}
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
