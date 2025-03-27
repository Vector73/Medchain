import Web3 from "web3";
import contract from "../../contracts/contract.json";
import { create } from 'ipfs-http-client';

export async function fetchData(walletAddress) {
    if (!walletAddress) return;
    const web3 = new Web3(window.ethereum);
    const myContract = new web3.eth.Contract(contract.abi, contract.address);

    try {
        const patientCID = await myContract.methods.getPatient(walletAddress).call();

        if (!patientCID) {
            console.log("No patient record found for this user.");
            return;
        }

        console.log("Latest CID:", patientCID);

        const response = await fetch(`http://localhost:8080/ipfs/${patientCID}`);
        if (!response.ok) {
            console.error("Failed to fetch data from IPFS");
            return;
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        return {patientCID, data}
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

export async function updateBlockchainUtil(walletAddress, updatedData, currentHash) {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const client = create(new URL("http://127.0.0.1:5001"));
      
        let existingData = {};
      
        if (currentHash) {
          try {
            const res = await fetch(`http://localhost:8080/ipfs/${currentHash}`);
            existingData = await res.json();
          } catch (error) {
            console.error("Error fetching existing IPFS data:", error);
          }
        }
      
        const newData = {
          ...existingData,
          wallet: walletAddress,
          ...updatedData,
        };

        const web3 = new Web3(window.ethereum);
        const myContract = new web3.eth.Contract(contract.abi, contract.address);
      
        const { cid } = await client.add(JSON.stringify(newData));
        const newHash = cid.toString();
      
        console.log("New CID:", newHash, "Previous CID:", currentHash);
      
        await myContract.methods.addPatient(newHash).send({ from: accounts[0] });
      
        const patientCID = await myContract.methods.getPatient(walletAddress).call();
        console.log("Updated Patient CIDs:", patientCID);
      
        return newHash;
}