/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from 'ipfs-http-client';
import { 
  Modal, Box, Button, TextField, Table, TableHead, TableRow, 
  TableCell, TableBody, MenuItem, Typography, TableContainer, 
  Paper, Chip, CircularProgress 
} from "@mui/material";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { fetchData, updateBlockchainUtil } from "./components/util";

const MedicalHistory = () => {
  const [cookies, setCookie] = useCookies();
  const [web3, setWeb3] = useState(null);
  const [mycontract, setMyContract] = useState(null);
  const [medHistory, setMedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [walletAddress, setWalletAddress] = useState(null);

  // Initialize web3 connection
  useEffect(() => {
    async function fetchAccount() {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
    fetchAccount();
  }, []);

  useEffect(() => {
    async function fetchMedicalHistory() {
        const {patientCID, data} = await fetchData(walletAddress);
        setCookie("hash", patientCID, { path: "/" });
        if (data && data.medicalhistory) {
            setMedHistory(data.medicalhistory);
        }
    }
    setLoading(true);
    fetchMedicalHistory()
    setLoading(false);
  
  }, [walletAddress, setCookie]);
  
  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const updateBlockchain = async (updatedHistory) => {
    const newHash = await updateBlockchainUtil(walletAddress, {medicalhistory: updatedHistory}, cookies["hash"])
  
    setCookie("hash", newHash, { path: "/" });
    setMedHistory(updatedHistory);
  };

  const submit = async () => {
    // Form validation
    if (!formData.disease || !formData.time || !formData.solved) {
      setError("Please fill in all required fields");
      return;
    }

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
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedHistory = medHistory.filter((_, i) => i !== index);
      await updateBlockchain(updatedHistory);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const getStatusChipColor = (status) => {
    switch(status) {
      case "Treated": return "success";
      case "Ongoing": return "warning";
      default: return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>
      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen w-full ml-72">
        <Navbar />
        <div className="p-6 md:p-10 flex flex-col">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h4" component="h1" className="text-2xl font-bold">
              Medical History
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => { 
                setFormData({ disease: "", time: "", solved: "", doctor: "", hospital: "", notes: "" }); 
                setEditingIndex(null);
                setOpenForm(true); 
              }}
            >
              Add Record
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <Paper 
              sx={{ 
                mb: 3, 
                p: 2, 
                backgroundColor: '#ffebee', 
                color: '#c62828',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography>{error}</Typography>
              <Button 
                size="small" 
                sx={{ ml: 2 }} 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </Paper>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center p-10">
              <CircularProgress />
            </div>
          ) : (
            <>
              {/* Empty state */}
              {medHistory.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No medical history records found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Get started by adding your first medical record
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setFormData({ disease: "", time: "", solved: "", doctor: "", hospital: "", notes: "" });
                      setOpenForm(true);
                    }}
                  >
                    Add First Record
                  </Button>
                </Paper>
              ) : (
                /* Table with records */
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Disease/Condition</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Diagnosed Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Hospital</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medHistory.map((record, index) => (
                        <TableRow 
                          key={index} 
                          onClick={() => handleRowClick(record)} 
                          sx={{ 
                            cursor: "pointer", 
                            transition: "background 0.2s", 
                            "&:hover": { backgroundColor: "#f0f7ff" },
                            "&:nth-of-type(odd)": { backgroundColor: "#fafafa" }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'medium' }}>{record.disease || "-"}</TableCell>
                          <TableCell>{formatDate(record.time)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.solved || "Unknown"} 
                              color={getStatusChipColor(record.solved)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{record.doctor || "-"}</TableCell>
                          <TableCell>{record.hospital || "-"}</TableCell>
                          <TableCell>
                            <Button 
                              size="small"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleRowClick(record); 
                              }}
                              sx={{ mr: 1 }}
                            >
                              View
                            </Button>
                            <Button 
                              color="primary" 
                              size="small"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                editRecord(index); 
                              }}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button 
                              color="error" 
                              size="small"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                deleteRecord(index); 
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box sx={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          width: { xs: "90%", sm: 500 }, 
          maxWidth: 500,
          bgcolor: "white", 
          p: 4, 
          borderRadius: "10px",
          boxShadow: 24
        }}>
          <SimpleBar style={{ maxHeight: "80vh" }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              {editingIndex !== null ? "Edit" : "Add"} Medical Record
            </Typography>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Disease/Condition" 
              name="disease" 
              value={formData.disease} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.disease}
              helperText={openForm && !formData.disease ? "This field is required" : ""}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Diagnosis Date"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="time" 
              value={formData.time} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.time}
              helperText={openForm && !formData.time ? "This field is required" : ""}
            />
            
            <TextField 
              select 
              fullWidth 
              margin="normal" 
              label="Status" 
              name="solved" 
              value={formData.solved} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.solved}
              helperText={openForm && !formData.solved ? "Please select a status" : ""}
            >
              <MenuItem value="Treated">Treated</MenuItem>
              <MenuItem value="Ongoing">Ongoing</MenuItem>
              <MenuItem value="Chronic">Chronic</MenuItem>
              <MenuItem value="Remission">Remission</MenuItem>
            </TextField>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Doctor's Name" 
              name="doctor" 
              value={formData.doctor} 
              onChange={handleFormChange} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Hospital/Clinic" 
              name="hospital" 
              value={formData.hospital} 
              onChange={handleFormChange} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleFormChange} 
              multiline 
              rows={3} 
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => setOpenForm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={submit}
                disabled={!formData.disease || !formData.time || !formData.solved}
              >
                Save
              </Button>
            </Box>
          </SimpleBar>
        </Box>
      </Modal>

      {/* Details Modal */}
      <Modal open={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
        <Box sx={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          width: { xs: "90%", sm: 450 }, 
          maxWidth: 450,
          bgcolor: "white", 
          p: 4, 
          borderRadius: "10px", 
          boxShadow: 24 
        }}>
          {selectedRecord && (
            <>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                Medical Record Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {selectedRecord.disease || "Unnamed Condition"}
                </Typography>
                {selectedRecord.solved && (
                  <Chip 
                    label={selectedRecord.solved} 
                    color={getStatusChipColor(selectedRecord.solved)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Diagnosed Date</Typography>
                <Typography variant="body1">{formatDate(selectedRecord.time) || "Not specified"}</Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Healthcare Provider</Typography>
                <Typography variant="body1">
                  {selectedRecord.doctor ? `Dr. ${selectedRecord.doctor}` : "Not specified"}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {selectedRecord.hospital || ""}
                </Typography>
              </Paper>
              
              {selectedRecord.notes && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Notes</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.notes}
                  </Typography>
                </Paper>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </Button>
                {selectedRecord && medHistory.findIndex(r => 
                  r.disease === selectedRecord.disease && 
                  r.time === selectedRecord.time
                ) !== -1 && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const index = medHistory.findIndex(r => 
                        r.disease === selectedRecord.disease && 
                        r.time === selectedRecord.time
                      );
                      editRecord(index);
                      setSelectedRecord(null);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default MedicalHistory;
