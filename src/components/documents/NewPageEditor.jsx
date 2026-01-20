import ImageCard from "./ImageCard";

export default function NewPageEditor({
  images,
  setImages,
  onBack,
  onPreview,
  onEditImage,
}) {
  if (!images.length) {
    return (
      <div className="text-sm text-gray-500">
        No images available
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 text-sm"
      >
        ← Back
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, index) => (
          <ImageCard
  key={index}
  img={img}
  index={index}
  setImages={setImages}
  onEdit={onEditImage}
/>

        ))}
      </div>

      <button
        onClick={onPreview}
        className="mt-4 w-full bg-blue-600 py-2 text-white rounded"
      >
        Preview & Print →
      </button>
    </div>
  );
}
