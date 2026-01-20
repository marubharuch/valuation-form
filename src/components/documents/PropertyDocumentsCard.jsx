export default function PropertyDocumentsCard({
  gpsBusy,
  gpsStep,
  onCaptureGPS,
  locationText,
  setLocationText,
  onManualBlur,
  propertyLocation,
 onUseForPage,
  onPaste,
  thumbs,
  onThumbClick,
}) {
  return (
    <div className="mb-4 rounded border p-3 bg-white">
      {/* GPS */}
      <div className="mb-3">
        <div className="font-medium mb-2">📍 Property Location (GPS)</div>

        <button
          onClick={onCaptureGPS}
          disabled={gpsBusy}
          className="w-full rounded bg-blue-600 py-2 text-white"
        >
          {gpsBusy ? `Collecting ${gpsStep}/7` : "Get Accurate Location"}
        </button>

        <input
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          onBlur={onManualBlur}
          placeholder="Latitude, Longitude"
          className="mt-2 w-full border px-2 py-1 text-sm rounded"
        />

        {propertyLocation && (
          <div className="mt-2 text-sm">
            <div><b>Lat:</b> {propertyLocation.lat}</div>
            <div><b>Lng:</b> {propertyLocation.lng}</div>
            <div><b>Accuracy:</b> {propertyLocation.accuracy || "—"}</div>
          </div>
        )}
      </div>

      {/* Clipboard buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onPaste("map")}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
        >
          📋 Map
        </button>
        <button
          onClick={() => onPaste("jantri")}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
        >
          📋 Jantri
        </button>
        <button
          onClick={() => onPaste("99acres")}
          className="bg-pink-600 text-white px-3 py-1 rounded text-sm"
        >
          📋 99acres
        </button>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {Object.entries(thumbs).map(([type, src]) =>
    src ? (
      <div
        key={type}
        className="flex gap-2 border rounded p-2 bg-gray-50"
      >
        <img
          src={src}
          className="h-16 w-16 object-cover rounded cursor-pointer"
          onClick={() => onThumbClick(type, src)}
        />

        <div className="flex-1 text-sm">
          <div className="font-medium capitalize">{type}</div>
          <div className="text-xs text-gray-500">
            Tap to re-crop / replace
          </div>
        </div>

        {/* DELETE BUTTON */}
        <button
          onClick={() => onThumbClick(type, null)}
          className="text-red-600 text-xs font-bold"
          title="Delete"
        >
          ✕
        </button>
      </div>
    ) : null
  )}
</div>
{Object.values(thumbs).some(Boolean) && (
  <button
    onClick={() => onUseForPage()}
    className="mt-4 w-full border border-blue-600 text-blue-600 py-2 rounded font-medium"
  >
    Use These Images → Preview / Print
  </button>
)}

    </div>
  );
}
