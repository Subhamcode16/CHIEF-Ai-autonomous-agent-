import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import MouseTrail from "@/components/MouseTrail";
import "@/App.css";

function App() {
  return (
    <BrowserRouter>
      <MouseTrail />
      <Toaster position="top-right" theme="dark" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
