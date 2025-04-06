import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import { useCookies } from "react-cookie";
import Sidebar2 from "../components/Sidebar2";

const PredictDisease = () => {
  const allSymptoms = [
    "itching",
    "skin_rash",
    "nodal_skin_eruptions",
    "continuous_sneezing",
    "shivering",
    "chills",
    "joint_pain",
    "stomach_pain",
    "acidity",
    "ulcers_on_tongue",
    "muscle_wasting",
    "vomiting",
    "burning_micturition",
    "spotting_urination",
    "fatigue",
    "weight_gain",
    "anxiety",
    "cold_hands_and_feets",
    "mood_swings",
    "weight_loss",
    "restlessness",
    "lethargy",
    "patches_in_throat",
    "irregular_sugar_level",
    "cough",
    "high_fever",
    "sunken_eyes",
    "breathlessness",
    "sweating",
    "dehydration",
    "indigestion",
    "headache",
    "yellowish_skin",
    "dark_urine",
    "nausea",
    "loss_of_appetite",
    "pain_behind_the_eyes",
    "back_pain",
    "constipation",
    "abdominal_pain",
    "diarrhoea",
    "mild_fever",
    "yellow_urine",
    "yellowing_of_eyes",
    "acute_liver_failure",
    "fluid_overload",
    "swelling_of_stomach",
    "swelled_lymph_nodes",
    "malaise",
    "blurred_and_distorted_vision",
    "phlegm",
    "throat_irritation",
    "redness_of_eyes",
    "sinus_pressure",
    "runny_nose",
    "congestion",
    "chest_pain",
    "weakness_in_limbs",
    "fast_heart_rate",
    "pain_during_bowel_movements",
    "pain_in_anal_region",
    "bloody_stool",
    "irritation_in_anus",
    "neck_pain",
    "dizziness",
    "cramps",
    "bruising",
    "obesity",
    "swollen_legs",
    "swollen_blood_vessels",
    "puffy_face_and_eyes",
    "enlarged_thyroid",
    "brittle_nails",
    "swollen_extremeties",
    "excessive_hunger",
    "extra_marital_contacts",
    "drying_and_tingling_lips",
    "slurred_speech",
    "knee_pain",
    "hip_joint_pain",
    "muscle_weakness",
    "stiff_neck",
    "swelling_joints",
    "movement_stiffness",
    "spinning_movements",
    "loss_of_balance",
    "unsteadiness",
    "weakness_of_one_body_side",
    "loss_of_smell",
    "bladder_discomfort",
    "foul_smell_of_urine",
    "continuous_feel_of_urine",
    "passage_of_gases",
    "internal_itching",
    "toxic_look_(typhos)",
    "depression",
    "irritability",
    "muscle_pain",
    "altered_sensorium",
    "red_spots_over_body",
    "belly_pain",
    "abnormal_menstruation",
    "dischromic_patches",
    "watering_from_eyes",
    "increased_appetite",
    "polyuria",
    "family_history",
    "mucoid_sputum",
    "rusty_sputum",
    "lack_of_concentration",
    "visual_disturbances",
    "receiving_blood_transfusion",
    "receiving_unsterile_injections",
    "coma",
    "stomach_bleeding",
    "distention_of_abdomen",
    "history_of_alcohol_consumption",
    "fluid_overload",
    "blood_in_sputum",
    "prominent_veins_on_calf",
    "palpitations",
    "painful_walking",
    "pus_filled_pimples",
    "blackheads",
    "scurring",
    "skin_peeling",
    "silver_like_dusting",
    "small_dents_in_nails",
    "inflammatory_nails",
    "blister",
    "red_sore_around_nose",
    "yellow_crust_ooze",
  ];

  const formatSymptomForDisplay = (symptom) => {
    return symptom
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const initialSymptomState = allSymptoms.reduce((acc, symptom) => {
    acc[symptom] = false;
    return acc;
  }, {});

  const [symptoms, setSymptoms] = useState(initialSymptomState);
  const [cookies, setCookies] = useCookies()
  const [inputValue, setInputValue] = useState("");
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [disease, setDisease] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState("");

  const dropdownRef = useRef(null);

  const selectedSymptoms = Object.keys(symptoms).filter(
    (symptom) => symptoms[symptom]
  );

  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredSymptoms([]);
      setShowDropdown(false);
      return;
    }

    const filtered = allSymptoms
      .filter(
        (symptom) =>
          !symptoms[symptom] &&
          symptom
            .replace(/_/g, " ")
            .toLowerCase()
            .includes(inputValue.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 results for better performance

    setFilteredSymptoms(filtered);
    setShowDropdown(filtered.length > 0);
  }, [inputValue, symptoms]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleSelectSymptom = (symptom) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: true,
    }));
    setInputValue("");
    setShowDropdown(false);
  };

  const handleRemoveSymptom = (symptom) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: false,
    }));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom");
      return;
    }

    setLoading(true);
    setError("");
    setDisease("");

    const apiUrl = `http://localhost:5000/${encodeURIComponent(JSON.stringify(selectedSymptoms))}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      setDisease(result);
    } catch (error) {
      console.error("Error:", error);
      setError(`Failed to get diagnosis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  function handleKeyDown({ code }) {
    const size = filteredSymptoms.length;
    if (code === "ArrowDown") {
      if (size < 1) return;
      setSelectedSymptom((symptom) => {
        if (!symptom) return filteredSymptoms[0];
        return filteredSymptoms.find((s, index) => {
          if (index === 0) return filteredSymptoms[size - 1] === symptom;
          return filteredSymptoms[(index - 1) % size] === symptom;
        });
      });
    } else if (code === "ArrowUp") {
      if (size < 1) return;
      setSelectedSymptom((symptom) => {
        if (!symptom) return filteredSymptoms[0];
        return filteredSymptoms.find((s, index) => {
          return filteredSymptoms[(index + 1) % size] === symptom;
        });
      });
    } else if (code === "Enter") {
      if (!inputValue) {
        document.querySelector(".submit").click();
      }
      if (!selectedSymptom) return;
      handleSelectSymptom(selectedSymptom);
      setSelectedSymptom("");
    } else {
      setSelectedSymptom("");
    }
  }

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
      {cookies.userType === "patient" ? <Sidebar /> : <Sidebar2 />}
      </div>

      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <Navbar />
        <div className="flex flex-col p-8 md:p-16 items-center">
          <h1 className="text-3xl font-bold mb-2">Not Feeling Well?</h1>
          <p className="text-lg text-center max-w-2xl mb-8">
            Enter your symptoms below for a quick diagnosis for your health.
            Yes, Medchain is here.
          </p>

          <div className="w-full max-w-2xl bg-white dark:bg-secondary-dark-bg rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2">
                What symptoms are you experiencing?
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSymptoms.map((symptom) => (
                  <div
                    key={symptom}
                    className="flex items-center bg-cyan-100 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-100 px-3 py-1 rounded-full"
                  >
                    <span>{formatSymptomForDisplay(symptom)}</span>
                    <button
                      type="button"
                      className="ml-2 text-cyan-600 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-100"
                      onClick={() => handleRemoveSymptom(symptom)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Type to search symptoms..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowDropdown(filteredSymptoms.length > 0)}
                />

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSymptoms.map((symptom) => (
                      <div
                        key={symptom}
                        className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${selectedSymptom === symptom ? "bg-gray-100" : ""}`}
                        onClick={() => handleSelectSymptom(symptom)}
                      >
                        {formatSymptomForDisplay(symptom)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSymptoms.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Please select at least one symptom
                </p>
              )}
            </div>

            <div className="mt-8">
              <button
                className={`w-full py-3 rounded-md font-medium text-white transition-colors submit ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-cyan-500 hover:bg-cyan-600"
                }`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Get Diagnosis"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: "1rem", color: "red" }}>
                {error}
              </div>
            )}
            {disease && (
              <div style={{ marginTop: "2rem", fontWeight: "bold" }}>
                Predicted Diagnosis: {disease}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PredictDisease;