export async function uploadToCloudinary(dataUrl) {
  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", "dss-val"); // your preset

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dm5qzcneg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
}
