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
  const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);
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

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      const res = await mycontract.methods.getPatient().call();
      for (let i = res.length - 1; i >= 0; i--) {
        if (res[i] === cookies['hash']) {
          const data = await (await fetch(`http://localhost:8080/ipfs/${res[i]}`)).json();
          const filteredHistory = (data.medicalhistory || []).filter(record => Object.keys(record).length > 0);
          setMedHistory(filteredHistory);
          break;
        }
      }
    };
    fetchMedicalHistory();
  }, [cookies]);

  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const updateBlockchain = async (updatedHistory) => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const client = create(new URL('http://127.0.0.1:5001'));
  
    // Fetch existing IPFS data
    let existingData = {};
    try {
      const res = await fetch(`http://localhost:8080/ipfs/${cookies['hash']}`);
      existingData = await res.json();
    } catch (error) {
      console.error("Error fetching existing IPFS data:", error);
    }
  
    // Preserve other sections (e.g., allergies) while updating medical history
    const newData = {
      ...existingData,
      medicalhistory: updatedHistory,  // Only update medical history
    };
  
    // Upload updated data to IPFS
    const { cid } = await client.add(JSON.stringify(newData));
    const hash = cid.toString();
  
    // Store new hash on the blockchain
    await mycontract.methods.addPatient(hash).send({ from: accounts[0] });
  
    // Update cookies and state
    setCookie('hash', hash);
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

          {/* Table Container with Fixed Header & Scrollable Body */}
          <TableContainer component={Paper} sx={{ width: "80%", mt: 3, borderRadius: 2, maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow className="table-header-row">
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

      {/* Form Modal */}
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

      {/* Details Modal */}
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
