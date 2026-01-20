export function openGoogleMap(loc) {
  if (!loc?.lat || !loc?.lng) return;
  window.open(
    `https://www.google.com/maps?q=${loc.lat},${loc.lng}&t=k`,
    "_blank"
  );
}
