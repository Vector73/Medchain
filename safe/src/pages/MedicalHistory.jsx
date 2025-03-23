import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from 'ipfs-http-client';
import { Modal, Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Typography, TableContainer, Paper } from "@mui/material";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const MedicalHistory = () => {
  const [cookies, setCookie] = useCookies();
  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(contract.abi, contract.address);
  const [medHistory, setMedHistory] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    disease: "",
    time: "",
    solved: "",
    doctor: "",
    hospital: "",
    notes: "",
  });
  const [walletAddress, setWalletAddress] = useState("");

  // Get user's wallet address on mount.
  useEffect(() => {
    async function fetchAccount() {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
    fetchAccount();
  }, []);

  // Fetch patient record by finding the one whose JSON wallet matches the user's wallet.
  useEffect(() => {
    async function fetchMedicalHistory() {
      if (!walletAddress) return;
  
      try {
        // Get the latest CID directly from the smart contract
        const patientCIDs = await mycontract.methods.getPatient(walletAddress).call();
  
        if (!patientCIDs || patientCIDs.length === 0) {
          console.log("No patient record found for this user.");
          return;
        }
  
        // Retrieve the latest CID from the array (last index)
        const latestCID = patientCIDs;
        console.log(latestCID)
  
        console.log("Latest CID:", latestCID);
  
        // Fetch medical history from IPFS
        const response = await fetch(`http://localhost:8080/ipfs/${latestCID}`);
        if (!response.ok) {
          console.error("Failed to fetch medical history from IPFS");
          return;
        }
  
        const data = await response.json();
        console.log("Fetched Medical History:", data);
  
        // Store the latest hash in a cookie
        setCookie("hash", latestCID, { path: "/" });
        await mycontract.methods.addPatient(latestCID).call();
        // Update state
        if (data && data.medicalhistory) {
          setMedHistory(data.medicalhistory);
        }
      } catch (error) {
        console.error("Error fetching medical history:", error);
      }
    }
  
    fetchMedicalHistory();
  }, [walletAddress, setCookie]);
  
  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  // Update blockchain with new medical history (preserving other data)
  const updateBlockchain = async (updatedHistory) => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const client = create(new URL("http://127.0.0.1:5001"));
  
    // Get the latest CID from cookie
    let currentHash = cookies["hash"];
    let existingData = {};
  
    if (currentHash) {
      try {
        const res = await fetch(`http://localhost:8080/ipfs/${currentHash}`);
        existingData = await res.json();
      } catch (error) {
        console.error("Error fetching existing IPFS data:", error);
      }
    }
  
    // Merge existing data with updated medical history
    const newData = {
      ...existingData,
      wallet: walletAddress, // Ensure wallet address is persisted
      medicalhistory: updatedHistory,
    };
  
    // Upload updated data to IPFS
    const { cid } = await client.add(JSON.stringify(newData));
    const newHash = cid.toString();
  
    console.log("New CID:", newHash, "Previous CID:", currentHash);
  
    // Store new CID on the blockchain (adds it to the user's CID list)
    await mycontract.methods.addPatient(newHash).send({ from: accounts[0] });
  
    // Fetch updated list of CIDs to verify update
    const patientCIDs = await mycontract.methods.getPatient(walletAddress).call();
    console.log("Updated Patient CIDs:", patientCIDs);
  
    // Update cookie and state with the latest hash
    setCookie("hash", newHash, { path: "/" });
    setMedHistory(updatedHistory);
  };
  
  
  const submit = async () => {
    const updatedHistory = editingIndex !== null
      ? medHistory.map((rec, i) => (i === editingIndex ? formData : rec))
      : [...medHistory, formData];
    await updateBlockchain(updatedHistory);
    setOpenForm(false);
    setEditingIndex(null);
    setFormData({ disease: "", time: "", solved: "", doctor: "", hospital: "", notes: "" });
  };
  
  const editRecord = (index) => {
    setFormData(medHistory[index]);
    setEditingIndex(index);
    setOpenForm(true);
  };
  
  const deleteRecord = async (index) => {
    const updatedHistory = medHistory.filter((_, i) => i !== index);
    await updateBlockchain(updatedHistory);
  };
  
  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>
      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen w-full ml-72">
        <Navbar />
        <div style={{ padding: "4rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Button 
            variant="contained" 
            onClick={() => { setFormData({ disease: "", time: "", solved: "", doctor: "", hospital: "", notes: "" }); setOpenForm(true); }}
          >
            Add Medical History
          </Button>
  
          <TableContainer component={Paper} sx={{ width: "80%", mt: 3, borderRadius: 2, maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Disease</TableCell>
                  <TableCell>Diagnosed Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {medHistory.map((record, index) => (
                  <TableRow 
                    key={index} 
                    onClick={() => handleRowClick(record)} 
                    sx={{ cursor: "pointer", transition: "background 0.3s", "&:hover": { backgroundColor: "#f0f0f0" } }}
                  >
                    <TableCell>{record.disease}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>{record.solved}</TableCell>
                    <TableCell>{record.doctor}</TableCell>
                    <TableCell>{record.hospital}</TableCell>
                    <TableCell>
                      <Button onClick={(e) => { e.stopPropagation(); editRecord(index); }}>Edit</Button>
                      <Button onClick={(e) => { e.stopPropagation(); deleteRecord(index); }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
  
      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "white", p: 4, borderRadius: "10px" }}>
          <SimpleBar style={{ maxHeight: "60vh" }}>
            <h2>{editingIndex !== null ? "Edit" : "Add"} Medical History</h2>
            <TextField fullWidth margin="normal" label="Disease" name="disease" value={formData.disease} onChange={handleFormChange} />
            <TextField fullWidth margin="normal" type="date" name="time" value={formData.time} onChange={handleFormChange} />
            <TextField select fullWidth margin="normal" label="Status" name="solved" value={formData.solved} onChange={handleFormChange}>
              <MenuItem value="Treated">Treated</MenuItem>
              <MenuItem value="Ongoing">Ongoing</MenuItem>
            </TextField>
            <TextField fullWidth margin="normal" label="Doctor's Name" name="doctor" value={formData.doctor} onChange={handleFormChange} />
            <TextField fullWidth margin="normal" label="Hospital" name="hospital" value={formData.hospital} onChange={handleFormChange} />
            <TextField fullWidth margin="normal" label="Notes" name="notes" value={formData.notes} onChange={handleFormChange} multiline rows={3} />
            <Button variant="contained" onClick={submit} sx={{ mt: 2 }}>Save</Button>
          </SimpleBar>
        </Box>
      </Modal>
  
      <Modal open={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "white", p: 4, borderRadius: "10px", boxShadow: 24 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>Medical History Details</Typography>
          {selectedRecord && Object.entries(selectedRecord).map(([key, value]) => (
            <Typography key={key}><strong>{key}:</strong> {value}</Typography>
          ))}
        </Box>
      </Modal>
    </div>
  );
};

export default MedicalHistory;
