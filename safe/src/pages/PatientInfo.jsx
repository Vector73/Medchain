import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  UserCircle,
  Calendar,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Hospital,
  Stethoscope,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar2 from "../components/Sidebar2";
import Footer from "../components/Footer";
import contract from "../contracts/contract.json";
import Web3 from "web3";

// Updated DetailModal to handle multi-line text
const DetailModal = ({ isOpen, onClose, data, columns }) => {
  if (!isOpen) return null;

  // Helper function to render multi-line text or truncate if very long
  const renderValue = (value) => {
    if (!value) return "N/A";

    // If value is a string with multiple lines or is very long
    if (
      typeof value === "string" &&
      (value.includes("\n") || value.length > 100)
    ) {
      return (
        <div
          className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words 
                               text-gray-800 font-semibold bg-gray-50 p-2 rounded"
        >
          {value}
        </div>
      );
    }

    return <span className="text-gray-800 font-semibold">{value}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex sticky top-0 z-10 justify-between items-center p-6 border-b bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Entry Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col border-b py-3 last:border-b-0"
            >
              <span className="text-gray-600 font-medium capitalize mb-2">
                {key.replace(/([A-Z])/g, " $1").toLowerCase()}
              </span>
              {renderValue(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Updated PaginatedTable to handle long text content
const PaginatedTable = ({ data, columns, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  // Render helper for long text
  const renderCellContent = (value) => {
    if (!value) return "N/A";

    // If value is a long string, truncate with ellipsis
    if (typeof value === "string" && value.length > 50) {
      return (
        <div
          className="max-w-xs truncate overflow-hidden text-ellipsis"
          title={value}
        >
          {value}
        </div>
      );
    }

    return value;
  };

  // Calculate total pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.length ? (
              currentItems.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 border-b cursor-pointer"
                  onClick={() => setSelectedRow(item)}
                >
                  {Object.values(item).map((value, colIndex) => (
                    <td key={colIndex} className="p-3 text-sm text-gray-600">
                      {renderCellContent(value)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Data Available
                      </h3>
                      <p className="text-gray-400 text-sm">
                        There are currently no records to display in this
                        section.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === index + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        data={selectedRow || {}}
        columns={columns}
      />
    </>
  );
};

const PatientInfo = () => {
  const { phash } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    async function fetchPatient() {
      try {
        const response = await fetch(`http://localhost:8080/ipfs/${phash}`);
        const data = await response.json();
        setPatient(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setLoading(false);
      }
    }
    fetchPatient();
  }, [phash]);

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

  const sections = [
    {
      key: "profile",
      label: "Profile",
      icon: UserCircle,
      content: () => (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(patient)
            .filter(([key]) =>
              [
                "firstName",
                "lastName",
                "email",
                "phone",
                "dateOfBirth",
                "gender",
                "bloodGroup",
                "height",
                "weight",
                "emergencyContactName",
                "emergencyContactPhone",
                "medicalAlerts",
              ].includes(key),
            )
            .map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-gray-500 text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </h3>
                <p className="text-lg font-semibold">{value || "N/A"}</p>
              </div>
            ))}
        </div>
      ),
    },
    {
      key: "insurance",
      label: "Insurance",
      icon: ShieldCheck,
      content: () => (
        <PaginatedTable
          data={patient.insurance || []}
          columns={[
            "Provider",
            "Policy Number",
            "Type",
            "Start Date",
            "End Date",
            "Coverage Amount",
            "Premium Amount",
            "Status",
            "Notes",
          ]}
        />
      ),
    },
    {
      key: "allergies",
      label: "Allergies",
      icon: AlertTriangle,
      content: () => (
        <PaginatedTable
          data={patient.allergies || []}
          columns={[
            "Allergen",
            "Reaction",
            "Severity",
            "First Occurrence",
            "Notes",
          ]}
        />
      ),
    },
    {
      key: "medicalHistory",
      label: "Medical History",
      icon: HeartPulse,
      content: () => (
        <PaginatedTable
          data={patient.medicalhistory || []}
          columns={["Disease", "Time", "Solved", "Doctor", "Hospital", "Notes"]}
        />
      ),
    },
    {
      key: "hospitalizationHistory",
      label: "Hospitalization",
      icon: Hospital,
      content: () => (
        <PaginatedTable
          data={patient.hospitalizationhistory || []}
          columns={[
            "Reason",
            "Admission Date",
            "Discharge Date",
            "Hospital",
            "Doctor",
            "Ward",
            "Treatment",
            "Notes",
          ]}
        />
      ),
    },
    {
      key: "checkupHistory",
      label: "Checkup History",
      icon: Stethoscope,
      content: () => (
        <PaginatedTable
          data={patient.visit || []}
          columns={[
            "Checkup Type",
            "Date",
            "Doctor",
            "Facility",
            "Findings",
            "Recommendations",
            "Follow Up Date",
            "Vital Signs",
            "Notes",
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar2 />
      </div>
      <div className="flex-1">
        <Navbar />
        <div className="ml-72 flex-1 p-8">
          {/* Section Navigation */}
          <div className="mb-6 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="flex border-b">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`
                                    flex items-center justify-center 
                                    px-4 py-3 w-full 
                                    ${
                                      activeSection === section.key
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }
                                    transition-colors duration-200
                                `}
                >
                  <section.icon className="mr-2" size={20} />
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Section Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {sections.find((s) => s.key === activeSection).content()}
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;
