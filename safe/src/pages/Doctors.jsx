import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";

const Doctors = () => {
    const [cookies, setCookie] = useCookies();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctors, setSelectedDoctors] = useState(new Set());
    const web3 = new Web3(window.ethereum);
    const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);

    useEffect(() => {
        async function getDoctors() {
            try {
                const res = await mycontract.methods.getDoctor().call();
                const docList = [];

                for (let i = 0; i < res.length; i++) {
                    const data = await (await fetch(`http://localhost:8080/ipfs/${res[i]}`)).json();
                    data["hash"] = res[i];
                    docList.push(data);
                }

                setDoctors(docList);
            } catch (error) {
                console.error("❌ Error fetching doctors:", error);
            }
        }

        async function getSelectedDoctors() {
            try {
                const patients = await mycontract.methods.getPatient().call();
                for (const pHash of patients) {
                    if (pHash === cookies["hash"]) {
                        const patientData = await (await fetch(`http://localhost:8080/ipfs/${pHash}`)).json();
                        setSelectedDoctors(new Set(patientData.selectedDoctors || []));
                        break;
                    }
                }
            } catch (error) {
                console.error("❌ Error fetching selected doctors:", error);
            }
        }

        getDoctors();
        getSelectedDoctors();
    }, [cookies["hash"]]); // Runs when user logs in

    async function addDoctor(hash) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const currentAddress = accounts[0];

            const patients = await mycontract.methods.getPatient().call();
            for (const pHash of patients) {
                if (pHash === cookies["hash"]) {
                    const patientData = await (await fetch(`http://localhost:8080/ipfs/${pHash}`)).json();
                    if (patientData.selectedDoctors.includes(hash)) {
                        alert("Doctor already added!");
                        return;
                    }

                    patientData.selectedDoctors.push(hash);

                    const client = create(new URL("http://127.0.0.1:5001"));
                    const { cid } = await client.add(JSON.stringify(patientData));
                    const newHash = cid.toString();

                    await mycontract.methods.addPatient(newHash).send({ from: currentAddress });

                    setSelectedDoctors(new Set([...selectedDoctors, hash]));
                    setCookie("hash", newHash);
                    alert("Doctor added successfully!");
                }
            }
        } catch (error) {
            console.error("❌ Error adding doctor:", error);
        }
    }

    return (
        <div className="flex relative dark:bg-main-dark-bg">
            <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
                <Sidebar />
            </div>

            <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full p-6">
                <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
                    <Navbar />
                </div>

                <div className="mt-8">
                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Available Doctors</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Select a doctor to add to your profile.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {doctors.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
                            No Doctors Found
                        </div>
                    ) : (
                        doctors.map((doctor, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-2xl transition">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{doctor.mail}</p>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Speciality: <span className="font-semibold">{doctor.speciality}</span>
                                </p>

                                <button
                                    className={`mt-4 px-4 py-2 rounded-lg transition text-white ${
                                        selectedDoctors.has(doctor.hash)
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                                    onClick={() => addDoctor(doctor.hash)}
                                    disabled={selectedDoctors.has(doctor.hash)}
                                >
                                    {selectedDoctors.has(doctor.hash) ? "Added ✅" : "Add Doctor"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Doctors;
