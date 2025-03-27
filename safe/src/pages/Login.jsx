import React, { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

const Auth = () => {
  const [account, setAccount] = useState(null);
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie] = useCookies(["hash"]);
  const navigate = useNavigate();

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      // Fetch user type and CID from blockchain
      await fetchUserData(web3, accounts[0]);
    } catch (error) {
      setError("MetaMask connection failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (web3, walletAddress) => {
    try {
      const myContract = new web3.eth.Contract(contract.abi, contract.address);

      // Get the latest CID directly from blockchain mappings
      const patientCIDs = await myContract.methods
        .getPatient(walletAddress)
        .call();
      console.log("Patient CIDs:", patientCIDs);
      const doctorCIDs = await myContract.methods
        .getDoctor(walletAddress)
        .call();

      console.log("Doctor CIDs:", doctorCIDs);

      let userHash = null;
      let userType = null;

      if (doctorCIDs) {
        userHash = doctorCIDs; // Latest doctor record
        userType = "doctor";
      }
      // Check for the latest patient CID
      else if (patientCIDs) {
        userHash = patientCIDs; // Latest patient record
        userType = "patient";
      }

      // Check for the latest doctor CID if not found in patients

      if (!userHash) {
        setError("User not found. Please register first.");
        return;
      }

      // Save the latest CID in cookies
      setCookie("hash", userHash, { path: "/" });
      setCookie("userType", userType);

      // Navigate based on user role
      setUserType(userType);
      navigate(
        userType === "patient" ? "/patient-dashboard" : "/doctor-dashboard",
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error fetching user data. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-teal-400 text-white p-6">
      <div className="bg-white text-gray-900 shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Login with MetaMask</h2>
        {loading ? (
          <p className="text-lg font-medium text-gray-600">Connecting...</p>
        ) : account ? (
          <p className="text-lg font-medium">
            Connected as: <span className="text-blue-600">{account}</span>
          </p>
        ) : (
          <button
            onClick={connectWallet}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-300"
          >
            Connect Wallet
          </button>
        )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
