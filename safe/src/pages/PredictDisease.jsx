import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

const PredictDisease = () => {
  const [symptoms, setSymptoms] = useState({
    Itching: false,
    "Skin Rash": false,
    Shivering: false,
    Vomiting: false,
    "Stomach Pain": false,
    Headache: false,
    Cough: false,
    "High Fever": false,
    Lethargy: false,
    "Chest Pain": false,
  });

  const [disease, setDisease] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSymptom = (symptom) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: !prev[symptom],
    }));
  };

  async function check() {
    setLoading(true);
    setError("");
    setDisease("");

    // Use localhost instead of hard-coded IP for development
    const apiUrl = `http://localhost:5000/${encodeURIComponent(JSON.stringify(symptoms))}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();

      // Check if the result is an error object
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
  }

  // List of symptom questions to display
  const symptomQuestions = [
    { key: "Itching", question: "Is there any itching?" },
    { key: "Skin Rash", question: "Do you have skin rashes?" },
    { key: "Shivering", question: "Are you shivering?" },
    { key: "Vomiting", question: "Do you feel vomiting?" },
    { key: "Stomach Pain", question: "Do you feel stomachache?" },
    { key: "Headache", question: "Do you feel headache?" },
    {
      key: "Cough",
      question: "Do you have cold, cough and feel like sneezing?",
    },
    { key: "High Fever", question: "Do you have fever?" },
    { key: "Lethargy", question: "Do you feel tired?" },
    { key: "Chest Pain", question: "Do you have chest pain?" },
  ];

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>

      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
          <Navbar />
        </div>
        <div className="flex flex-col p-8 md:p-16 items-center">
          <h1 className="text-3xl font-bold mb-2">Not Feeling Well?</h1>
          <p className="text-lg text-center max-w-2xl mb-8">
            Answer the following questions for a quick diagnosis for your
            health. Yes, Medchain is here.
          </p>

          <form
            className="w-full max-w-2xl bg-white dark:bg-secondary-dark-bg rounded-lg shadow-lg p-6"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <div className="space-y-4">
              {symptomQuestions.map((item, index) => (
                <div key={item.key} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{index + 1}.</span>
                      <span>{item.question}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSymptom(item.key)}
                      className={`px-4 py-2 rounded-full transition-colors duration-200 font-medium ${
                        symptoms[item.key]
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {symptoms[item.key] ? "Yes" : "No"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button
                className={`w-full py-3 rounded-md font-medium text-white transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-cyan-500 hover:bg-cyan-600"
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Processing..." : "Get Diagnosis"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {disease && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <h3 className="text-xl font-bold mb-1">Predicted Diagnosis:</h3>
                <p className="text-lg">{disease}</p>
              </div>
            )}
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PredictDisease;
