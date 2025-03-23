import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Sidebar2 from "../components/Sidebar2";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";

const Patients = () => {
    const web3 = new Web3(window.ethereum);
    const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);
    const [patients, setPatients] = useState([]);
    const [cookies] = useCookies();

    useEffect(() => {
        async function getPatients() {
            try {
                console.log("🔄 Fetching patients from blockchain...");
                const res = await mycontract.methods.getPatient().call();
                console.log("✅ Raw Patient Data from Blockchain:", res);

                const pat = [];
                const vis = new Set();

                for (let i = res.length - 1; i >= 0; i--) {
                    console.log(`🌍 Fetching IPFS data: http://localhost:8080/ipfs/${res[i]}`);

                    const response = await fetch(`http://localhost:8080/ipfs/${res[i]}`);
                    if (!response.ok) {
                        console.error(`❌ Failed to fetch patient ${res[i]} from IPFS`);
                        continue;
                    }

                    const data = await response.json();
                    console.log("📄 Fetched Patient Data from IPFS:", data);

                    if (data.mail && !vis.has(data.mail)) {
                        vis.add(data.mail);

                        if (data.selectedDoctors && data.selectedDoctors.includes(cookies["hash"])) {
                            data["hash"] = res[i]; // Add IPFS hash to patient data
                            pat.push(data);
                        }
                    }
                }

                console.log("✅ Final Processed Patients List:", pat);
                setPatients(pat);
            } catch (error) {
                console.error("❌ Error fetching patients:", error);
            }
        }

        getPatients();
    }, []);

    function view(phash) {
        window.location.href = `/patientData/${phash}`;
    }

    async function treated(phash) {
        try {
            console.log(`🛠 Updating treatment status for patient ${phash}`);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const currentaddress = accounts[0];

            const response = await fetch(`http://localhost:8080/ipfs/${phash}`);
            if (!response.ok) {
                console.error(`❌ Failed to fetch patient ${phash} from IPFS`);
                return;
            }

            const data = await response.json();
            console.log("📄 Patient Data Before Update:", data);

            // Remove current doctor from selectedDoctors
            data.selectedDoctors = data.selectedDoctors.filter(doc => doc !== cookies["hash"]);
            console.log("✂️ Updated Patient Data:", data);

            const client = create(new URL("http://127.0.0.1:5001"));
            const { cid } = await client.add(JSON.stringify(data));
            const hash = cid.toString();

            console.log(`✅ New IPFS Hash: ${hash}`);

            await mycontract.methods.addPatient(hash).send({ from: currentaddress });

            // ✅ FIX: Update State Correctly
            setPatients(prevPatients =>
                prevPatients.map(patient =>
                    patient.hash === phash
                        ? { ...patient, selectedDoctors: [], hash } // Mark as treated in UI
                        : patient
                )
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

            <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full p-6">
                <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
                    <Navbar />
                </div>

                <div className="mt-8">
                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Patient Records</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage and review patients assigned to you.
                    </p>
                </div>

                {/* Patients Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {patients.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                            No Patients Found
                        </div>
                    ) : (
                        patients.map((patient, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-2xl transition">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{patient.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{patient.mail}</p>

                                <div className="mt-4 flex justify-between">
                                    <button 
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                        onClick={() => view(patient.hash)}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        className={`px-4 py-2 rounded-lg transition text-white ${
                                            patient.selectedDoctors.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                                        }`}
                                        onClick={() => treated(patient.hash)}
                                        disabled={patient.selectedDoctors.length === 0}
                                    >
                                        {patient.selectedDoctors.length === 0 ? "Treated ✅" : "Mark as Treated"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Patients;
