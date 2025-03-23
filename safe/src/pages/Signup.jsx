import React, { useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import { useNavigate } from "react-router-dom";
import { create } from "ipfs-http-client";

const Register = () => {
  const [userType, setUserType] = useState("patient");
  const [formData, setFormData] = useState({ name: "", mail: "", wallet: "", password: "", license: "", speciality: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const registerUser = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }

    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.requestAccounts();
    formData.wallet = accounts[0];

    const myContract = new web3.eth.Contract(contract.abi, contract.address);
    const client = create(new URL("http://127.0.0.1:5001"));

    // Upload to IPFS
    const { cid } = await client.add(JSON.stringify(formData));
    const hash = cid.toString();

    // Store hash on blockchain
    const method = userType === "doctor" ? myContract.methods.addDoctor : myContract.methods.addPatient;
    await method(hash).send({ from: accounts[0] });

    alert("Registration successful!");
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
      <div className="bg-white text-gray-900 shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Register</h2>
        <select onChange={(e) => setUserType(e.target.value)} className="mb-4 p-2 border rounded">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        <input name="name" placeholder="Full Name" onChange={handleChange} className="block w-full p-2 mb-2 border rounded" />
        <input name="mail" type="email" placeholder="Email" onChange={handleChange} className="block w-full p-2 mb-2 border rounded" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="block w-full p-2 mb-2 border rounded" />
        {userType === "doctor" && (
          <>
            <input name="speciality" placeholder="Speciality" onChange={handleChange} className="block w-full p-2 mb-2 border rounded" />
            <input name="license" placeholder="License Number" onChange={handleChange} className="block w-full p-2 mb-2 border rounded" />
          </>
        )}
        <button onClick={registerUser} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-300">
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;