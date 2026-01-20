import { openGoogleMap } from "../../utils/openGoogleMap";

export default function PropertyLocation({
  gpsBusy,
  gpsStep,
  locationText,
  setLocationText,
  propertyLocation,
  onCaptureGPS,
}) {
  return (
    <div className="mb-4 rounded border bg-gray-50 p-3">
      <div className="mb-2 text-sm font-medium">📍 Property Location</div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto]">
        <button
          onClick={onCaptureGPS}
          disabled={gpsBusy}
          className="h-10 rounded bg-blue-600 px-3 text-white"
        >
          {gpsBusy ? `Collecting ${gpsStep}/7` : "📍 Get"}
        </button>

        <input
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Latitude, Longitude"
          className="h-10 rounded border px-2 text-sm"
        />

        <button
          onClick={() => openGoogleMap(propertyLocation)}
          disabled={!propertyLocation}
          className="h-10 rounded bg-green-600 px-3 text-white"
        >
          🗺 Map
        </button>
      </div>
    </div>
  );
}
