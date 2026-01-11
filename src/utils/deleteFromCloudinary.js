export async function deleteFromCloudinary(publicId) {
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/delete_by_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId }),
    }
  );

  return res.json();
}
