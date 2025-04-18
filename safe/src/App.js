import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";

import { Navbar, Footer, Sidebar, ThemeSettings } from "./components";
import {
  Home,
  MyProfile,
  MyProfileDoctor,
  Doctors,
  Visits,
  Patients,
  MedicalHistory,
  HospitalizationHistory,
  Insurance,
  Allergies,
  PredictDisease,
  Login,
  Signup,
} from "./pages";
import PatientInfo from "./pages/PatientInfo";
import "./App.css";

import { useStateContext } from "./contexts/ContextProvider";
import PatientPDF from "./pages/Download";

const App = () => {
  const {
    setCurrentColor,
    setCurrentMode,
    currentMode,
    activeMenu,
    currentColor,
    themeSettings,
    setThemeSettings,
  } = useStateContext();

  useEffect(() => {
    const currentThemeColor = localStorage.getItem("colorMode");
    const currentThemeMode = localStorage.getItem("themeMode");
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor);
      setCurrentMode(currentThemeMode);
    }
  }, []);

  return (
    <div className={currentMode === "Dark" ? "dark" : ""}>
      <BrowserRouter>
        <Routes>
          {/* dashboard  */}
          <Route path="/" element={<Home />} />
          <Route path="/patient-dashboard" element={<MyProfile />} />
          <Route path="/doctor-dashboard" element={<MyProfileDoctor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* pages  */}
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/allergies" element={<Allergies />} />
          <Route path="/medicalhistory" element={<MedicalHistory />} />
          <Route
            path="/hospitalizationhistory"
            element={<HospitalizationHistory />}
          />
          <Route path="/predictdisease" element={<PredictDisease />} />
          <Route path="/checkuphistory" element={<Visits />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/pdf" element={<PatientPDF />} />
          <Route exact path="/patientData/:phash" element={<PatientInfo />} />
          <Route exact path="/pdf/:phash" element={<PatientPDF />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
