export default function ClipboardToolbar({ onPaste }) {
    if (typeof onPaste !== "function") {
  return null;
}

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => onPaste("map")}
        className="rounded bg-purple-600 px-3 py-1 text-sm text-white"
      >
        📋 Map
      </button>

      <button
        onClick={() => onPaste("jantri")}
        className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
      >
        📋 Jantri
      </button>

      <button
        onClick={() => onPaste("99acres")}
        className="rounded bg-pink-600 px-3 py-1 text-sm text-white"
      >
        📋 99acres
      </button>
    </div>
  );
}
