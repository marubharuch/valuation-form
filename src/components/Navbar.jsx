import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="print-hidden bg-blue-600 text-white p-3 flex justify-between items-center">
      {/* App title → Dashboard */}
      <b
        className="cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        🏠 Property App
      </b>

      <div className="flex gap-2">
        {/* Dashboard button (hide if already there) */}
        {location.pathname !== "/dashboard" && (
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white text-blue-600 px-3 py-1 rounded"
          >
            Dashboard
          </button>
        )}

        {/* New Case button */}
        {location.pathname !== "/case/new" && (
          <button
            onClick={() => navigate("/case/new")}
            className="bg-white text-blue-600 px-3 py-1 rounded"
          >
            + New Case
          </button>
        )}
      </div>
    </div>
  );
}
