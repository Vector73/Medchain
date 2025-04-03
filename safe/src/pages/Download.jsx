import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, Settings, Check, X } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Navbar from "../components/Navbar";
import Sidebar2 from "../components/Sidebar2";
import Footer from "../components/Footer";
import { useCookies } from "react-cookie";
import { Sidebar } from "../components";

const PatientPDF = () => {
  const { phash } = useParams();
  const [hash, setHash] = useState("");
  const [patient, setPatient] = useState(null);
  const [cookies, setCookies] = useCookies();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    profile: true,
    insuranceRecords: true,
    allergies: true,
    medicalHistory: true,
    hospitalizationHistory: true,
    checkuphistory: true,
  });

  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchPatient() {
      try {
        if (cookies.userType === "doctor") {
          setHash(phash);
        } else {
          setHash(cookies["hash"]);
        }
        const response = await fetch(`http://localhost:8080/ipfs/${hash}`);
        const data = await response.json();
        setPatient(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setLoading(false);
      }
    }
    fetchPatient();
  }, [phash, hash, cookies]);

  const toggleSection = (section) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const generatePDF = async () => {
    if (!patient) return;

    setGenerating(true);

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Add a blank page
      var page = pdfDoc.addPage([600, 800]);

      // Get the standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Set initial drawing position
      let currentY = 780;
      const leftMargin = 50;
      const lineHeight = 15;

      // Helper function for drawing text
      const drawText = (text, x, y, fontToUse = font, size = 10) => {
        page.drawText(text, {
          x,
          y,
          size,
          font: fontToUse,
          color: rgb(0, 0, 0),
        });
      };

      // Helper function for drawing headers
      const drawHeader = (text, y) => {
        page.drawRectangle({
          x: leftMargin - 10,
          y: y - 5,
          width: 520,
          height: 25,
          color: rgb(0.9, 0.9, 1),
          borderColor: rgb(0.8, 0.8, 0.9),
          borderWidth: 1,
        });

        drawText(text, leftMargin, y, boldFont, 12);
        return y - 30;
      };

      // Add title
      drawText(
        `Medical Record - ${patient.name}`,
        leftMargin,
        currentY,
        boldFont,
        16,
      );
      currentY -= 30;

      drawText(
        `Generated on: ${new Date().toLocaleDateString()}`,
        leftMargin,
        currentY,
      );
      currentY -= 40;

      // Add profile information if selected
      if (selectedSections.profile) {
        currentY = drawHeader("Patient Profile", currentY);

        const profileFields = [
          { label: "Name", value: patient.name },
          { label: "Email", value: patient.email },
          { label: "Phone", value: patient.phone },
          { label: "Date of Birth", value: patient.dateOfBirth },
          { label: "Gender", value: patient.gender },
          { label: "Blood Group", value: patient.bloodGroup },
          { label: "Height", value: patient.height },
          { label: "Weight", value: patient.weight },
          { label: "Emergency Contact", value: patient.emergencyContactName },
          { label: "Emergency Phone", value: patient.emergencyContactPhone },
          { label: "Medical Alerts", value: patient.medicalAlerts || "None" },
        ];

        for (const field of profileFields) {
          drawText(`${field.label}:`, leftMargin, currentY, boldFont);
          drawText(field.value || "NA", leftMargin + 120, currentY);
          currentY -= lineHeight;
        }

        currentY -= 20;
      }

      // Add allergies if selected
      if (
        selectedSections.allergies &&
        patient.allergies &&
        patient.allergies.length > 0
      ) {
        currentY = drawHeader("Allergies", currentY);

        const allergiesColumns = [
          "Allergen",
          "Reaction",
          "Severity",
          "First Occurrence",
        ];

        // Draw table header
        let colX = leftMargin;
        for (const col of allergiesColumns) {
          drawText(col, colX, currentY, boldFont);
          colX += 120;
        }
        currentY -= lineHeight;

        // Draw horizontal line
        page.drawLine({
          start: { x: leftMargin - 5, y: currentY + 5 },
          end: { x: 530, y: currentY + 5 },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });

        currentY -= 5;

        // Draw allergy data
        for (const allergy of patient.allergies) {
          // Check if we need a new page
          if (currentY < 100) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          colX = leftMargin;
          drawText(allergy.allergen || "N/A", colX, currentY);
          colX += 120;
          drawText(allergy.reaction || "N/A", colX, currentY);
          colX += 120;
          drawText(allergy.severity || "N/A", colX, currentY);
          colX += 120;
          drawText(allergy.firstOccurrence || "N/A", colX, currentY);

          currentY -= lineHeight * 1.5;
        }

        currentY -= 10;
      }

      // Add medical history if selected
      if (
        selectedSections.medicalHistory &&
        patient.medicalhistory &&
        patient.medicalhistory.length > 0
      ) {
        if (currentY < 200) {
          // Add new page
          currentY = 780;
          page = pdfDoc.addPage([600, 800]);
        }

        currentY = drawHeader("Medical History", currentY);

        const medHistColumns = [
          "Disease",
          "Time",
          "Solved",
          "Doctor",
          "Hospital",
        ];

        // Draw table header
        let colX = leftMargin;
        for (const col of medHistColumns) {
          drawText(col, colX, currentY, boldFont);
          colX += 100;
        }
        currentY -= lineHeight;

        // Draw horizontal line
        page.drawLine({
          start: { x: leftMargin - 5, y: currentY + 5 },
          end: { x: 530, y: currentY + 5 },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });

        currentY -= 5;

        // Draw medical history data
        for (const history of patient.medicalhistory) {
          // Check if we need a new page
          if (currentY < 100) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          colX = leftMargin;
          drawText(history.disease || "N/A", colX, currentY);
          colX += 100;
          drawText(history.time || "N/A", colX, currentY);
          colX += 100;
          drawText(history.solved || "N/A", colX, currentY);
          colX += 100;
          drawText(history.doctor || "N/A", colX, currentY);
          colX += 100;
          drawText(history.hospital || "N/A", colX, currentY);

          currentY -= lineHeight * 1.5;
        }

        currentY -= 10;
      }

      // Add insuranceRecords if selected
      if (
        selectedSections.insuranceRecords &&
        patient.insuranceRecords &&
        patient.insuranceRecords.length > 0
      ) {
        if (currentY < 200) {
          // Add new page
          currentY = 780;
          page = pdfDoc.addPage([600, 800]);
        }

        currentY = drawHeader("Insurance Information", currentY);

        // Update insuranceRecords columns to include all fields
        const insuranceRecordsColumns = [
          "Provider",
          "Policy #",
          "Type",
          "Status",
          "Coverage",
          "Premium",
        ];

        // Draw table header
        let colX = leftMargin;
        for (const col of insuranceRecordsColumns) {
          drawText(col, colX, currentY, boldFont);
          colX += 90;
        }
        currentY -= lineHeight;

        // Draw horizontal line
        page.drawLine({
          start: { x: leftMargin - 5, y: currentY + 5 },
          end: { x: 530, y: currentY + 5 },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });

        currentY -= 5;

        // Draw insuranceRecords data
        for (const insuranceRecords of patient.insuranceRecords) {
          // Check if we need a new page
          if (currentY < 100) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          colX = leftMargin;
          drawText(insuranceRecords.provider || "N/A", colX, currentY);
          colX += 90;
          drawText(insuranceRecords.policyNumber || "N/A", colX, currentY);
          colX += 90;
          drawText(insuranceRecords.type || "N/A", colX, currentY);
          colX += 90;
          drawText(insuranceRecords.status || "N/A", colX, currentY);
          colX += 90;
          drawText(insuranceRecords.coverageAmount || "N/A", colX, currentY);
          colX += 90;
          drawText(insuranceRecords.premiumAmount || "N/A", colX, currentY);

          currentY -= lineHeight * 1.5;

          // Add dates on a new line to avoid crowding
          if (currentY < 100) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          colX = leftMargin;
          drawText("Start Date:", colX, currentY, boldFont);
          colX += 90;
          drawText(insuranceRecords.startDate || "N/A", colX, currentY);
          colX += 90;
          drawText("End Date:", colX, currentY, boldFont);
          colX += 90;
          drawText(insuranceRecords.endDate || "N/A", colX, currentY);

          currentY -= lineHeight * 1.5;

          // Add notes if available
          if (insuranceRecords.notes) {
            if (currentY < 100) {
              // Add new page
              currentY = 780;
              page = pdfDoc.addPage([600, 800]);
            }

            colX = leftMargin;
            drawText("Notes:", colX, currentY, boldFont);

            // Handle multiline notes
            const notesText = insuranceRecords.notes || "N/A";
            const maxWidth = 450; // Maximum width for notes

            // Simple wrapping of notes text
            let remainingText = notesText;
            while (remainingText.length > 0 && currentY > 100) {
              let endIndex = Math.min(60, remainingText.length);
              if (endIndex < remainingText.length) {
                // Try to find a space to break at
                while (endIndex > 0 && remainingText[endIndex] !== " ") {
                  endIndex--;
                }
                if (endIndex === 0)
                  endIndex = Math.min(60, remainingText.length);
              }

              drawText(
                remainingText.substring(0, endIndex),
                colX + 10,
                currentY - lineHeight,
              );
              remainingText = remainingText.substring(endIndex).trim();
              currentY -= lineHeight;
            }

            currentY -= lineHeight;
          }

          // Add a separator between insuranceRecords entries
          page.drawLine({
            start: { x: leftMargin - 5, y: currentY + 5 },
            end: { x: 530, y: currentY + 5 },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9),
          });

          currentY -= 10;
        }

        currentY -= 10;
      }

      // Add hospitalization history if selected
      if (
        selectedSections.hospitalizationHistory &&
        patient.hospitalizationhistory &&
        patient.hospitalizationhistory.length > 0
      ) {
        if (currentY < 200) {
          // Add new page
          currentY = 780;
          page = pdfDoc.addPage([600, 800]);
        }

        currentY = drawHeader("Hospitalization History", currentY);

        const hospitalColumns = [
          "Reason",
          "Admission",
          "Discharge",
          "Hospital",
          "Doctor",
        ];

        // Draw table header
        let colX = leftMargin;
        for (const col of hospitalColumns) {
          drawText(col, colX, currentY, boldFont);
          colX += 100;
        }
        currentY -= lineHeight;

        // Draw horizontal line
        page.drawLine({
          start: { x: leftMargin - 5, y: currentY + 5 },
          end: { x: 530, y: currentY + 5 },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });

        currentY -= 5;

        // Draw hospitalization data
        for (const hospital of patient.hospitalizationhistory) {
          // Check if we need a new page
          if (currentY < 100) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          colX = leftMargin;
          drawText(hospital.reason || "N/A", colX, currentY);
          colX += 100;
          drawText(hospital.admissionDate || "N/A", colX, currentY);
          colX += 100;
          drawText(hospital.dischargeDate || "N/A", colX, currentY);
          colX += 100;
          drawText(hospital.hospital || "N/A", colX, currentY);
          colX += 100;
          drawText(hospital.doctor || "N/A", colX, currentY);

          currentY -= lineHeight * 1.5;
        }

        currentY -= 10;
      }

      // Add checkup history if selected
      if (
        selectedSections.checkuphistory &&
        patient.checkuphistory &&
        patient.checkuphistory.length > 0
      ) {
        if (currentY < 200) {
          // Add new page
          currentY = 780;
          page = pdfDoc.addPage([600, 800]);
        }

        currentY = drawHeader("Checkup History", currentY);

        // For each checkuphistory, create a more detailed display
        for (const checkuphistory of patient.checkuphistory) {
          // Check if we need a new page
          if (currentY < 150) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          // Draw checkuphistory header with date and type
          const checkuphistoryTitle = `${checkuphistory.date || "N/A"} - ${checkuphistory.checkupType || "Check-up"}`;
          drawText(checkuphistoryTitle, leftMargin, currentY, boldFont, 11);
          currentY -= lineHeight * 1.5;

          // Draw fields in two columns
          const fieldPairs = [
            [
              "Doctor",
              checkuphistory.doctor || "N/A",
              "Facility",
              checkuphistory.facility || "N/A",
            ],
            [
              "Vital Signs",
              checkuphistory.vitalSigns || "N/A",
              "Follow-Up Date",
              checkuphistory.followUpDate || "N/A",
            ],
          ];

          for (const [label1, value1, label2, value2] of fieldPairs) {
            if (currentY < 100) {
              // Add new page
              currentY = 780;
              page = pdfDoc.addPage([600, 800]);
            }

            drawText(`${label1}:`, leftMargin, currentY, boldFont);
            drawText(value1, leftMargin + 80, currentY);

            drawText(`${label2}:`, leftMargin + 250, currentY, boldFont);
            drawText(value2, leftMargin + 330, currentY);

            currentY -= lineHeight * 1.2;
          }

          // Draw findings and recommendations
          if (currentY < 150) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          // Draw findings
          drawText("Findings:", leftMargin, currentY, boldFont);
          currentY -= lineHeight;

          // Handle multiline findings
          const findingsText = checkuphistory.findings || "N/A";

          // Simple wrapping of findings text
          let remainingText = findingsText;
          while (remainingText.length > 0 && currentY > 100) {
            let endIndex = Math.min(80, remainingText.length);
            if (endIndex < remainingText.length) {
              // Try to find a space to break at
              while (endIndex > 0 && remainingText[endIndex] !== " ") {
                endIndex--;
              }
              if (endIndex === 0) endIndex = Math.min(80, remainingText.length);
            }

            drawText(
              remainingText.substring(0, endIndex),
              leftMargin + 10,
              currentY,
            );
            remainingText = remainingText.substring(endIndex).trim();
            currentY -= lineHeight;
          }

          currentY -= lineHeight;

          if (currentY < 150) {
            // Add new page
            currentY = 780;
            page = pdfDoc.addPage([600, 800]);
          }

          // Draw recommendations
          drawText("Recommendations:", leftMargin, currentY, boldFont);
          currentY -= lineHeight;

          // Handle multiline recommendations
          const recommendationsText = checkuphistory.recommendations || "N/A";

          // Simple wrapping of recommendations text
          remainingText = recommendationsText;
          while (remainingText.length > 0 && currentY > 100) {
            let endIndex = Math.min(80, remainingText.length);
            if (endIndex < remainingText.length) {
              // Try to find a space to break at
              while (endIndex > 0 && remainingText[endIndex] !== " ") {
                endIndex--;
              }
              if (endIndex === 0) endIndex = Math.min(80, remainingText.length);
            }

            drawText(
              remainingText.substring(0, endIndex),
              leftMargin + 10,
              currentY,
            );
            remainingText = remainingText.substring(endIndex).trim();
            currentY -= lineHeight;
          }

          currentY -= lineHeight;

          // Draw notes if available
          if (checkuphistory.notes) {
            if (currentY < 150) {
              // Add new page
              currentY = 780;
              page = pdfDoc.addPage([600, 800]);
            }

            drawText("Notes:", leftMargin, currentY, boldFont);
            currentY -= lineHeight;

            // Handle multiline notes
            const notesText = checkuphistory.notes;

            // Simple wrapping of notes text
            remainingText = notesText;
            while (remainingText.length > 0 && currentY > 100) {
              let endIndex = Math.min(80, remainingText.length);
              if (endIndex < remainingText.length) {
                // Try to find a space to break at
                while (endIndex > 0 && remainingText[endIndex] !== " ") {
                  endIndex--;
                }
                if (endIndex === 0)
                  endIndex = Math.min(80, remainingText.length);
              }

              drawText(
                remainingText.substring(0, endIndex),
                leftMargin + 10,
                currentY,
              );
              remainingText = remainingText.substring(endIndex).trim();
              currentY -= lineHeight;
            }
          }

          // Add a separator between checkup entries
          page.drawLine({
            start: { x: leftMargin - 5, y: currentY - 5 },
            end: { x: 530, y: currentY - 5 },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9),
          });

          currentY -= 20;
        }
      }

      // Add a footer to each page with patient ID and page number
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        p.drawText(
          `Patient ID: ${hash.substring(0, 10)}... | Page ${i + 1} of ${pages.length}`,
          {
            x: 50,
            y: 30,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
          },
        );
      }

      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();

      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${patient.name}_MedicalRecord.pdf`;
      link.click();

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      setGenerating(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl text-red-500">
        Patient data not found
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        {cookies.userType === "patient" ? <Sidebar /> : <Sidebar2 />}
      </div>
      <div className="flex-1 ml-72 w-full">
        <Navbar />
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">
                Download Patient Record
              </h1>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                >
                  <Settings size={20} className="mr-2" />
                  <span>Sections</span>
                </button>

                <button
                  onClick={generatePDF}
                  disabled={generating}
                  className={`flex items-center justify-center p-2 ${
                    generating ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
                  } rounded-lg text-white min-w-40`}
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} className="mr-2" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section settings panel */}
            {showSettings && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h2 className="text-lg font-medium text-gray-700 mb-3">
                  Select sections to include
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="profileCheck"
                      checked={selectedSections.profile}
                      onChange={() => toggleSection("profile")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="profileCheck" className="text-gray-700">
                      Patient Profile
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="insuranceRecordsCheck"
                      checked={selectedSections.insuranceRecords}
                      onChange={() => toggleSection("insuranceRecords")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="insuranceRecordsCheck"
                      className="text-gray-700"
                    >
                      Insurance
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allergiesCheck"
                      checked={selectedSections.allergies}
                      onChange={() => toggleSection("allergies")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allergiesCheck" className="text-gray-700">
                      Allergies
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="medicalHistoryCheck"
                      checked={selectedSections.medicalHistory}
                      onChange={() => toggleSection("medicalHistory")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="medicalHistoryCheck"
                      className="text-gray-700"
                    >
                      Medical History
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hospitalizationCheck"
                      checked={selectedSections.hospitalizationHistory}
                      onChange={() => toggleSection("hospitalizationHistory")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="hospitalizationCheck"
                      className="text-gray-700"
                    >
                      Hospitalization
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checkupCheck"
                      checked={selectedSections.checkuphistory}
                      onChange={() => toggleSection("checkuphistory")}
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="checkupCheck" className="text-gray-700">
                      Checkup History
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Preview */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-700 mb-3">
                Preview
              </h2>
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <div className="text-center">
                    <FileText size={64} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-gray-500">Medical Record PDF</p>
                    <div className="mt-3 text-sm text-gray-600">
                      <div>
                        {selectedSections.profile && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded m-1">
                            Profile
                          </span>
                        )}
                        {selectedSections.allergies && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded m-1">
                            Allergies
                          </span>
                        )}
                        {selectedSections.medicalHistory && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded m-1">
                            Medical History
                          </span>
                        )}
                      </div>
                      <div>
                        {selectedSections.insuranceRecords && (
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded m-1">
                            Insurance
                          </span>
                        )}
                        {selectedSections.hospitalizationHistory && (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded m-1">
                            Hospitalization
                          </span>
                        )}
                        {selectedSections.checkuphistory && (
                          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded m-1">
                            Checkups
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient info summary */}
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-3">
                Patient Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm">Name</h3>
                  <p className="text-lg font-semibold">{`${patient.name}`}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm">DOB</h3>
                  <p className="text-lg font-semibold">
                    {patient.dateOfBirth || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm">Blood Group</h3>
                  <p className="text-lg font-semibold">
                    {patient.bloodGroup || "N/A"}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm">Medical Alerts</h3>
                  <p className="text-lg font-semibold">
                    {patient.medicalAlerts || "None"}
                  </p>
                </div>
              </div>
            </div>

            {/* Success notification */}
            {showSuccess && (
              <div className="fixed bottom-5 right-5 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 shadow-md rounded-r z-50 flex items-center animate-fade-in-right">
                <Check size={20} className="text-green-500 mr-2" />
                <span>PDF successfully generated and downloaded!</span>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="ml-4 text-green-500 hover:text-green-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default PatientPDF;
