export async function uploadToCloudinary(dataUrl, folder) {
  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", "dss-val");

  // ✅ optional folder support
  if (folder) {
    formData.append("folder", folder);
  }

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dm5qzcneg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    console.error("Cloudinary error:", data);
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
}
