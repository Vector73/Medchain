import React, { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

const Auth = () => {
  const [account, setAccount] = useState(null);
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState("");
  const [cookies, setCookie] = useCookies(["hash"]);
  const navigate = useNavigate();

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        fetchUserData(web3, accounts[0]);
      } catch (error) {
        setError("MetaMask connection failed");
      }
    } else {
      setError("MetaMask not detected");
    }
  };

  const fetchUserData = async (web3, walletAddress) => {
    try {
      const myContract = new web3.eth.Contract(contract.abi, contract.address);
      const patientCIDs = await myContract.methods.getPatient().call();
      const doctorCIDs = await myContract.methods.getDoctor().call();
      
      let userHash = null;
      let userType = null;
      console.log(patientCIDs)
      for (const cid of patientCIDs) {
        try {
          const response = await fetch(`http://localhost:8080/ipfs/${cid}`);
          if (!response.ok) continue;
          const data = await response.json();
          if (data.wallet && data.wallet.toLowerCase() === walletAddress.toLowerCase()) {
            userHash = cid;
            userType = "patient";
          }
        } catch (err) {
          console.error("Error fetching record:", err);
        }
      }
      
      if (!userHash) {
        for (const cid of doctorCIDs) {
          try {
            const response = await fetch(`http://localhost:8080/ipfs/${cid}`);
            if (!response.ok) continue;
            const data = await response.json();
            if (data.wallet && data.wallet.toLowerCase() === walletAddress.toLowerCase()) {
              userHash = cid;
              userType = "doctor";
            }
          } catch (err) {
            console.error("Error fetching record:", err);
          }
        }
      }
      
      if (!userHash) {
        setError("User not found. Please register first.");
        return;
      }
      
      setCookie("hash", userHash);
      setUserType(userType);
      navigate(userType === "patient" ? "/patient-dashboard" : "/doctor-dashboard");
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error fetching user data");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-teal-400 text-white p-6">
      <div className="bg-white text-gray-900 shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Login with MetaMask</h2>
        {account ? (
          <p className="text-lg font-medium">Connected as: <span className="text-blue-600">{account}</span></p>
        ) : (
          <button 
            onClick={connectWallet} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-300">
            Connect Wallet
          </button>
        )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
