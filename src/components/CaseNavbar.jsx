import { NavLink, useParams } from "react-router-dom";

export default function CaseNavbar() {
  const { caseId } = useParams();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded text-sm ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700"
    }`;

  return (
    <div className="print-hidden bg-white border-b px-2 py-2 flex gap-2 overflow-x-auto">
      <NavLink to={`/case/${caseId}`} className={linkClass}>
        Case
      </NavLink>
   <NavLink to={`/case/${caseId}/rawpics`} className={linkClass}>
        Raw Pics
      </NavLink>
      <NavLink to={`/case/${caseId}/documents`} className={linkClass}>
        Documents
      </NavLink>

      <NavLink to={`/case/${caseId}/property`} className={linkClass}>
        Property
      </NavLink>

   
    </div>
  );
}
