import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

const PredictDisease = () => {
  const [itching, setItching] = useState(false);
  const [skinrash, setSkinRash] = useState(false);
  const [shivering, setShivering] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [stomachache, setStomachAche] = useState(false);
  const [headache, setHeadAche] = useState(false);
  const [cough, setCough] = useState(false);
  const [fever, setFever] = useState(false);
  const [lethargy, setLethargy] = useState(false);
  const [chestpain, setChestPain] = useState(false);

  const [disease, setDisease] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Convert string "true"/"false" to actual boolean
  const stringToBoolean = (value) => {
    return value === "true";
  };

  async function check() {
    setLoading(true);
    setError("");
    setDisease("");
    
    const data = {
      "Itching": itching,
      "Skin Rash": skinrash,
      "Shivering": shivering,
      "Vomiting": vomiting,
      "Stomach Pain": stomachache,
      "Headache": headache,
      "Cough": cough,
      "High Fever": fever,
      "Lethargy": lethargy,
      "Chest Pain": chestpain,
    };
    
    // Use localhost instead of hard-coded IP for development
    const apiUrl = `http://localhost:5000/${encodeURIComponent(JSON.stringify(data))}`;
    
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

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>

      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
          <Navbar />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "4rem",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <h1>Not Feeling Well?</h1>
          <p>
            Answer the following questions for a quick diagnosis for your
            health. Yes, Medchain is here.
          </p>
          <form
            style={{
              width: "60%",
              margin: "2rem",
              gap: "1rem",
              display: "flex",
              flexDirection: "column",
            }}
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>1.</h2>
                <h2>Is there any itching?</h2>
              </div>
              <select
                id=""
                name="Itching"
                onChange={(e) => setItching(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>2.</h2>
                <h2>Do you have skin rashes?</h2>
              </div>
              <select
                id=""
                name="Skin Rash"
                onChange={(e) => setSkinRash(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>3.</h2>
                <h2>Are you shivering?</h2>
              </div>
              <select
                id=""
                name="Shivering"
                onChange={(e) => setShivering(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>4.</h2>
                <h2>Do you feel vomiting?</h2>
              </div>
              <select
                id=""
                name="Vomiting"
                onChange={(e) => setVomiting(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>5.</h2>
                <h2>Do you feel stomachache?</h2>
              </div>
              <select
                id=""
                name="Stomach Pain"
                onChange={(e) => setStomachAche(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>6.</h2>
                <h2>Do you feel headache?</h2>
              </div>
              <select
                id=""
                name="Headache"
                onChange={(e) => setHeadAche(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>7.</h2>
                <h2>Do you have cold, cough and feel like sneezing?</h2>
              </div>
              <select
                id=""
                name="Cough"
                onChange={(e) => setCough(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>8.</h2>
                <h2>Do you have fever?</h2>
              </div>
              <select
                id=""
                name="High Fever"
                onChange={(e) => setFever(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>9.</h2>
                <h2>Do you feel tired?</h2>
              </div>
              <select
                id=""
                name="Lethargy"
                onChange={(e) => setLethargy(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                <h2>10.</h2>
                <h2>Do you have chest pain?</h2>
              </div>
              <select
                id=""
                name="Chest Pain"
                onChange={(e) => setChestPain(stringToBoolean(e.target.value))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <button
              style={{
                marginTop: "1rem",
                backgroundColor: "rgb(3, 201, 215)",
                padding: "8px 12px",
                borderRadius: "4px",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer"
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit"}
            </button>
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
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PredictDisease;