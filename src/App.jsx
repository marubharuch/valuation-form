import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import CaseDetails from "./pages/CaseDetails";
import Documents from "./pages/Documents";
import AddProperty from "./pages/AddProperty";
import PreviewA4 from "./pages/PreviewA4";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* New case */}
        <Route path="/case/new" element={<CaseDetails />} />

        {/* Existing case */}
        <Route path="/case/:caseId" element={<CaseDetails />} />
        <Route path="/case/:caseId/documents" element={<Documents />} />
        <Route path="/case/:caseId/property" element={<AddProperty />} />
        <Route path="/case/:caseId/preview" element={<PreviewA4 />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
