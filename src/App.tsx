import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/home/HomePage";
import PatientDetailPage from "./pages/patient/PatientDetailPage";
import ImageViewerPage from "./pages/viewer/ImageViewerPage";
import Viewer3DPage from "./pages/viewer3d/Viewer3DPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/patient/:id" element={<PatientDetailPage />} />
      </Route>
      <Route path="/patient/:id/view/:eye/:imageIndex" element={<ImageViewerPage />} />
      <Route path="/patient/:id/3d/:eye" element={<Viewer3DPage />} />
    </Routes>
  );
}
