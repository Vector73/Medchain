import React, { useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import { useNavigate } from "react-router-dom";
import { create } from "ipfs-http-client";
import { AtSign, UserCircle, Lock, Stethoscope, IdCard } from "lucide-react";

const Register = () => {
  const [userType, setUserType] = useState("patient");
  const [formData, setFormData] = useState({
    name: "",
    mail: "",
    wallet: "",
    password: "",
    license: "",
    speciality: "",
  });
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

    try {
      let userHash = null;

      try {
        userHash = await myContract.methods.getPatient(accounts[0]).call();
      } catch (error) {
        console.warn("User not found, creating a new record...");
      }

      if (userHash) {
        alert("User already registered!");
        return;
      }

      const client = create(new URL("http://127.0.0.1:5001"));

      const defaultProfile = {
        name: formData.name,
        mail: formData.mail,
        wallet: formData.wallet,
        password: formData.password,
        ...(userType === "doctor" && {
          speciality: formData.speciality,
          license: formData.license,
        }),
      };

      const { cid } = await client.add(JSON.stringify(defaultProfile));
      const hash = cid.toString();

      const method =
        userType === "doctor"
          ? myContract.methods.addDoctor
          : myContract.methods.addPatient;
      await method(hash).send({ from: accounts[0] });

      alert("Registration successful!");
      navigate("/");
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-600 mt-2">Choose your account type</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setUserType("patient")}
                className={`px-4 py-2 rounded-full flex items-center transition-all duration-300 ${
                  userType === "patient"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <UserCircle className="mr-2" size={20} />
                Patient
              </button>
              <button
                onClick={() => setUserType("doctor")}
                className={`px-4 py-2 rounded-full flex items-center transition-all duration-300 ${
                  userType === "doctor"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Stethoscope className="mr-2" size={20} />
                Doctor
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                name="name"
                placeholder="Full Name"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                name="mail"
                type="email"
                placeholder="Email"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {userType === "doctor" && (
              <>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="speciality"
                    placeholder="Speciality"
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="license"
                    placeholder="License Number"
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <button
              onClick={registerUser}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <span>Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
