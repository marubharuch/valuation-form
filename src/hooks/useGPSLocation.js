import { useState } from "react";
import { captureAccurateLocation } from "../utils/captureAccurateLocation";

export function useGPSLocation(onSave) {
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsStep, setGpsStep] = useState(0);

  async function capture(existing) {
    try {
      setGpsBusy(true);
      const loc = await captureAccurateLocation({
        existingLocation: existing,
        onProgress: setGpsStep,
      });
      onSave(loc);
    } finally {
      setGpsBusy(false);
      setGpsStep(0);
    }
  }

  return { gpsBusy, gpsStep, capture };
}
