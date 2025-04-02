import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Sidebar2 from "../components/Sidebar2";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";

const Patients = () => {
  const [web3, setWeb3] = useState(null);
  const [myContract, setMyContract] = useState(null);
  const [patients, setPatients] = useState([]);
  const [cookies] = useCookies();
  const [currentDoctorAddress, setCurrentDoctorAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initWeb3() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          const web3Instance = new Web3(window.ethereum);
          const contractInstance = new web3Instance.eth.Contract(
            contract["abi"],
            contract["address"],
          );

          setWeb3(web3Instance);
          setMyContract(contractInstance);
          setCurrentDoctorAddress(accounts[0]);
        } catch (error) {
          console.error("Error initializing Web3:", error);
          setLoading(false);
        }
      }
    }

    initWeb3();
  }, []);

  useEffect(() => {
    async function getPatients() {
      if (!myContract || !currentDoctorAddress) return;

      try {
        setLoading(true);
        const patientAddresses = await myContract.methods.getPatients().call();
        const pat = [];
        const vis = new Set();

        for (let i = patientAddresses.length - 1; i >= 0; i--) {
          const patientAddress = patientAddresses[i];
          const patientCID = await myContract.methods
            .getPatient(patientAddress)
            .call();

          const response = await fetch(
            `http://localhost:8080/ipfs/${patientCID}`,
          );
          if (!response.ok) {
            console.error(`❌ Failed to fetch patient ${patientCID} from IPFS`);
            continue;
          }

          const data = await response.json();

          // Check if patient is not already treated by this doctor
          const isTreatedByCurrentDoctor =
            data.treatedBy &&
            data.treatedBy.some(
              (treatment) =>
                treatment.doctorAddress.toLowerCase() ===
                currentDoctorAddress.toLowerCase(),
            );

          // Only add patients that are either assigned or not treated by current doctor
          if (
            !isTreatedByCurrentDoctor &&
            data.selectedDoctors &&
            data.selectedDoctors.some(
              (doc) => doc.toLowerCase() === currentDoctorAddress.toLowerCase(),
            ) &&
            data.mail &&
            !vis.has(data.mail)
          ) {
            vis.add(data.mail);
            data["hash"] = patientCID;
            pat.push(data);
          }
        }

        console.log("✅ Final Processed Patients List:", pat);
        setPatients(pat);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching patients:", error);
        setLoading(false);
      }
    }

    getPatients();
  }, [myContract, currentDoctorAddress]);

  function view(phash) {
    window.location.href = `/patientData/${phash}`;
  }

  async function treated(phash) {
    try {
      console.log(`🛠 Updating treatment status for patient ${phash}`);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentAddress = accounts[0];

      const response = await fetch(`http://localhost:8080/ipfs/${phash}`);
      if (!response.ok) {
        console.error(`❌ Failed to fetch patient ${phash} from IPFS`);
        return;
      }

      const data = await response.json();
      console.log("📄 Patient Data Before Update:", data);

      // Remove current doctor from selectedDoctors
      data.selectedDoctors = data.selectedDoctors.filter(
        (doc) => doc.toLowerCase() !== currentAddress.toLowerCase(),
      );

      // Add a treated status to track treatment
      data.treatedBy = data.treatedBy || [];
      data.treatedBy.push({
        [currentAddress]: new Date().toISOString(),
      });

      console.log("✂️ Updated Patient Data:", data);

      const client = create(new URL("http://127.0.0.1:5001"));
      const { cid } = await client.add(JSON.stringify(data));
      const hash = cid.toString();

      console.log(`✅ New IPFS Hash: ${hash}`);

      await myContract.methods.addPatient(hash).send({ from: currentAddress });

      // Remove the patient from the current list
      setPatients((prevPatients) =>
        prevPatients.filter((patient) => patient.hash !== phash),
      );
    } catch (err) {
      console.error("❌ Error in treated():", err);
    }
  }

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar2 />
      </div>

      <div className="flex-1 ml-72">
        <Navbar />
        <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen w-full p-6">
          <div className="mt-8">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">
              Patient Records
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Manage and review patients assigned to you.
            </p>
          </div>

          {/* Patients Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {patients.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                No Patients Assigned
              </div>
            ) : (
              patients.map((patient, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {patient.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {patient.mail}
                  </p>

                  <div className="mt-4 flex justify-between">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                      onClick={() => view(patient.hash)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patients;
