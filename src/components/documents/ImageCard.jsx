import { PRINT_SIZES } from "../../constants/documentConstants";

export default function ImageCard({ img, index, setImages,onEdit }) {
  function update(patch) {
    setImages((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, ...patch } : i
      )
    );
  }

  return (
    <div className="border p-2 rounded">
      <img
  src={img.src}
  onClick={() => onEdit(index)}
  className="h-32 w-full object-cover rounded cursor-pointer"
/>


      <input
        value={img.title || ""}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Image title"
        className="mt-1 w-full border px-1 text-xs"
      />

      <div className="mt-2 flex flex-wrap gap-1">
        {PRINT_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => update({ printSize: s, selected: true })}
            className={`px-2 py-1 text-xs border rounded ${
              img.printSize === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-1 flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={!!img.selected}
          onChange={() => update({ selected: !img.selected })}
        />
        Include
      </label>
    </div>  
  );
}
