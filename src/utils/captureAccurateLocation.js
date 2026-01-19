export function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
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

export async function captureAccurateLocation({
  existingLocation,
  onProgress,
}) {
  if (!navigator.geolocation) {
    throw new Error("Geolocation not supported");
  }

  const TOTAL = 7;
  const readings = [];

  const getOnce = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  for (let i = 0; i < TOTAL; i++) {
    try {
      const r = await getOnce();
      readings.push(r);
      onProgress?.(i + 1, TOTAL);
    } catch {}
    await new Promise((r) => setTimeout(r, 1200));
  }

  const best = readings.reduce((a, b) =>
    a.accuracy < b.accuracy ? a : b
  );

  if (existingLocation) {
    const dist = distanceInMeters(
      existingLocation.lat,
      existingLocation.lng,
      best.lat,
      best.lng
    );

    if (dist > 150) {
      const ok = window.confirm(
        `New location is ${Math.round(dist)} meters away.\nReplace existing location?`
      );
      if (!ok) throw new Error("User cancelled");
    }
  }

  return {
    ...best,
    capturedAt: Date.now(),
    text: `${best.lat.toFixed(6)}, ${best.lng.toFixed(
      6
    )} (±${best.accuracy.toFixed(1)}m)`,
  };
}
