import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { urlToBase64 } from "../utils/urlToBase64";

export function useCaseDocuments(caseId) {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [images, setImages] = useState([]);
  const [propertyLocation, setPropertyLocation] = useState(null);
  const [locationText, setLocationText] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "cases", caseId));
      const data = snap.data() || {};

      setPages(data.documents?.pages || []);

      if (data.rowPics?.length) {
        const raw = await Promise.all(
          data.rowPics.map(async (r) => ({
            src: await urlToBase64(r.imageUrl),
            title: "",
            printSize: null,
            selected: false,
            source: "raw",
          }))
        );
        setImages(raw);
      }

      setPropertyLocation(data.propertyLocation || null);
      setLocationText(data.propertyLocationText || "");
      setLoading(false);
    }

    load();
  }, [caseId]);

  async function saveLocation(loc) {
    await updateDoc(doc(db, "cases", caseId), {
      propertyLocation: loc,
      propertyLocationText: loc.text || `${loc.lat}, ${loc.lng}`,
    });
    setPropertyLocation(loc);
    setLocationText(loc.text || `${loc.lat}, ${loc.lng}`);
  }

  return {
    loading,
    pages,
    images,
    setImages,
    propertyLocation,
    locationText,
    setLocationText,
    saveLocation,
  };
}
