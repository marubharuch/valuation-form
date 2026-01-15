import { useState } from "react";

export default function LocationCapture() {
  const [readings, setReadings] = useState([]);
  const [collecting, setCollecting] = useState(false);
  const [bestLocation, setBestLocation] = useState(null);

  const TOTAL_READINGS = 7; // 5–10 recommended

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

  const collectLocations = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setCollecting(true);
    setReadings([]);
    setBestLocation(null);

    const collected = [];

    for (let i = 0; i < TOTAL_READINGS; i++) {
      try {
        const loc = await getLocationOnce();
        collected.push(loc);
        setReadings([...collected]);
      } catch (err) {
        console.error("Location error", err);
      }

      await new Promise((r) => setTimeout(r, 1500)); // gap
    }

    // pick best accuracy
    const best = collected.reduce((a, b) =>
      a.accuracy < b.accuracy ? a : b
    );

    setBestLocation(best);

    // save locally
    localStorage.setItem(
      "bestLocation",
      JSON.stringify(best)
    );

    setCollecting(false);
  };

  const openInGoogleMaps = () => {
    if (!bestLocation) return;

    const { lat, lng } = bestLocation;

    // Android Google Maps intent
    const url = `https://www.google.com/maps?q=${lat},${lng}&t=k`;

    window.open(url, "_blank");
  };

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={collectLocations}
        disabled={collecting}
        className="w-full bg-blue-600 text-white py-3 rounded"
      >
        {collecting
          ? `Collecting… (${readings.length}/${TOTAL_READINGS})`
          : "📍 Get Accurate Location"}
      </button>

      {readings.length > 0 && (
        <div className="text-sm text-gray-600">
          Latest accuracy:{" "}
          {readings[readings.length - 1].accuracy.toFixed(1)} m
        </div>
      )}

      {bestLocation && (
        <div className="bg-gray-100 p-3 rounded text-sm">
          <div><b>Latitude:</b> {bestLocation.lat}</div>
          <div><b>Longitude:</b> {bestLocation.lng}</div>
          <div><b>Accuracy:</b> {bestLocation.accuracy.toFixed(1)} m</div>

          <button
            onClick={openInGoogleMaps}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded"
          >
            🗺 Open in Google Maps (Satellite)
          </button>
        </div>
      )}
    </div>
  );
}
