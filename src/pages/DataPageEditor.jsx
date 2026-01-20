import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { rtdb } from "../firebase";

export default function DataPageEditor({ schema }) {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({});
  const [valuer, setValuer] = useState("K");
  const [footerText, setFooterText] = useState("");

  /* ---------- INIT DATA FROM SCHEMA ---------- */
  useEffect(() => {
    if (!schema) return;

    const initial = {};
    schema.fields.forEach(f => {
      initial[f.key] = "";
    });

    setData(initial);
  }, [schema]);

  function update(key, value) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!caseId || !schema) return;

    const pageId = schema.id;

    await set(
      ref(rtdb, `cases/${caseId}/dataPages/${pageId}`),
      {
        pageId,
        type: schema.id,
        valuer,
        footerText,
        data,
        updatedAt: Date.now(),
      }
    );

    alert("Data page saved ✅");
    navigate(-1);
  }

  if (!schema) {
    return <div className="p-4 text-red-600">Schema missing</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">
        {schema.title}
      </h2>

      {/* VALUER */}
      <Field
        label="Valuer"
        value={valuer}
        onChange={setValuer}
      />

      {/* FIELDS */}
      {schema.fields.map(field => (
        <Field
          key={field.key}
          label={field.label}
          value={data[field.key] ?? ""}
          multiline={field.multiline}
          type={field.type}
          onChange={(v) => update(field.key, v)}
        />
      ))}

      {/* FOOTER */}
      <Field
        label="Footer Text"
        value={footerText}
        onChange={setFooterText}
      />

      <button
        onClick={save}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}

/* ---------- SMALL INPUT HELPER ---------- */
function Field({ label, value, onChange, multiline, type = "text" }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>

      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded w-full px-2 py-1"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded w-full px-2 py-1"
        />
      )}
    </div>
  );
}
