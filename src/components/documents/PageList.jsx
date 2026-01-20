export default function PageList({ pages = [], onOpenPage }) {
  if (!pages.length) {
    return (
      <div className="text-sm text-gray-500 border p-3 rounded">
        No pages created yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pages.map((page, index) => {
        const firstImg = page.images?.[0];

        return (
          <div
            key={page.pageId || index}
            onClick={() => onOpenPage(page)}
            className="flex gap-3 cursor-pointer rounded border p-3 hover:bg-gray-50"
          >
            {/* Thumbnail */}
            <div className="h-16 w-16 flex-shrink-0 rounded border bg-gray-100 overflow-hidden">
              {firstImg?.imageUrl ? (
                <img
                  src={firstImg.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1">
              <div className="font-medium">
                Page {index + 1}
              </div>

              {/* Titles */}
              <div className="text-xs text-gray-600">
                {page.images
                  .map((img) => img.title || "Untitled")
                  .join(", ")}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {page.images.length} images
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
