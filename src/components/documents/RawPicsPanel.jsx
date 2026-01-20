export default function RawPicsPanel({
  images = [],
  setImages,
  onCreatePage,
}) {
  function toggle(index) {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, selected: !img.selected } : img
      )
    );
  }

  const selectedCount = images.filter((i) => i.selected).length;

  if (!images.length) {
    return (
      <div className="text-sm text-gray-500 border p-3 rounded">
        No raw pictures found
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div key={index} className="border p-2 rounded">
            <img
              src={img.src}
              className="h-32 w-full object-cover rounded"
            />

            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!img.selected}
                onChange={() => toggle(index)}
              />
              Select
            </label>
          </div>
        ))}
      </div>

      <button
        disabled={!selectedCount}
        onClick={onCreatePage}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        Create Page with {selectedCount} images →
      </button>
    </div>
  );
}
