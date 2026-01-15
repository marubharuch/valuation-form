import { useState } from "react";

const TOTAL_READINGS = 7; // 5–10 ideal

export default function PropertyLocation({ value, onChange }) {
  const [readings, setReadings] = useState([]);
  const [collecting, setCollecting] = useState(false);
  const [best, setBest] = useState(value || null);

  const getLocationOnce = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            time: Date.now(),
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });

  const collectAccurateLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setCollecting(true);
    setReadings([]);
    setBest(null);

    const collected = [];

    for (let i = 0; i < TOTAL_READINGS; i++) {
      try {
        const loc = await getLocationOnce();
        collected.push(loc);
        setReadings([...collected]);
      } catch (e) {
        console.warn("Location error", e);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    const bestReading = collected.reduce((a, b) =>
      a.accuracy < b.accuracy ? a : b
    );

    const finalLoc = {
      lat: bestReading.lat,
      lng: bestReading.lng,
      accuracy: bestReading.accuracy,
      capturedAt: Date.now(),
    };

    setBest(finalLoc);

    // save locally
    localStorage.setItem(
      "propertyLocation",
      JSON.stringify(finalLoc)
    );

    // notify parent (Property page)
    onChange?.(finalLoc);

    setCollecting(false);
  };

  const openGoogleMaps = () => {
    if (!best) return;
    const url = `https://www.google.com/maps?q=${best.lat},${best.lng}&t=k`;
    window.open(url, "_blank");
  };

  return (
    <div className="border rounded p-3 bg-gray-50 space-y-3">
      <div className="font-semibold text-sm">
        📍 Property Location (GPS)
      </div>

      <button
        onClick={collectAccurateLocation}
        disabled={collecting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
      >
        {collecting
          ? `Collecting… (${readings.length}/${TOTAL_READINGS})`
          : "Get Accurate Location"}
      </button>

      {readings.length > 0 && (
        <div className="text-xs text-gray-600">
          Latest accuracy:{" "}
          {readings[readings.length - 1].accuracy.toFixed(1)} m
        </div>
      )}

      {best && (
        <div className="text-xs bg-white p-2 rounded border">
          <div><b>Lat:</b> {best.lat}</div>
          <div><b>Lng:</b> {best.lng}</div>
          <div><b>Accuracy:</b> {best.accuracy.toFixed(1)} m</div>

          <button
            onClick={openGoogleMaps}
            className="mt-2 w-full bg-green-600 text-white py-2 rounded"
          >
            🗺 Open in Google Maps (Satellite)
          </button>
        </div>
      )}
    </div>
  );
}
