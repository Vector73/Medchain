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

const HospitalizationHistory = () => {
  const [cookies, setCookie] = useCookies();
  const [web3, setWeb3] = useState(null);
  const [mycontract, setMyContract] = useState(null);
  const [hospitalizationHistory, setHospitalizationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    reason: "",
    admissionDate: "",
    dischargeDate: "",
    hospital: "",
    doctor: "",
    ward: "",
    treatment: "",
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
    async function fetchHospitalizationHistory() {
        const {patientCID, data} = await fetchData(walletAddress);
        setCookie("hash", patientCID, { path: "/" });
        if (data && data.hospitalizationhistory) {
            setHospitalizationHistory(data.hospitalizationhistory);
        }
    }
    setLoading(true);
    fetchHospitalizationHistory()
    setLoading(false);
  
  }, [walletAddress, setCookie]);
  
  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const updateBlockchain = async (updatedHistory) => {
    const newHash = await updateBlockchainUtil(walletAddress, {hospitalizationhistory: updatedHistory}, cookies["hash"])
  
    setCookie("hash", newHash, { path: "/" });
    setHospitalizationHistory(updatedHistory);
  };

  const submit = async () => {
    // Form validation
    if (!formData.reason || !formData.admissionDate || !formData.hospital) {
      setError("Please fill in all required fields");
      return;
    }

    const updatedHistory = editingIndex !== null
      ? hospitalizationHistory.map((rec, i) => (i === editingIndex ? formData : rec))
      : [...hospitalizationHistory, formData];
    
    await updateBlockchain(updatedHistory);
    setOpenForm(false);
    setEditingIndex(null);
    setFormData({ 
      reason: "", 
      admissionDate: "", 
      dischargeDate: "", 
      hospital: "", 
      doctor: "", 
      ward: "", 
      treatment: "", 
      notes: "" 
    });
  };

  const editRecord = (index) => {
    setFormData(hospitalizationHistory[index]);
    setEditingIndex(index);
    setOpenForm(true);
  };

  const deleteRecord = async (index) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedHistory = hospitalizationHistory.filter((_, i) => i !== index);
      await updateBlockchain(updatedHistory);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const getStatusChipColor = (status) => {
    if (!status.dischargeDate) return "warning";
    return "success";
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

  const getStatus = (record) => {
    return record.dischargeDate ? "Discharged" : "Admitted";
  };

  const calculateDuration = (admissionDate, dischargeDate) => {
    if (!admissionDate || !dischargeDate) return "-";
    
    try {
      const admission = new Date(admissionDate);
      const discharge = new Date(dischargeDate);
      
      const diffTime = Math.abs(discharge - admission);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays === 1 ? "1 day" : `${diffDays} days`;
    } catch (e) {
      return "-";
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
              Hospitalization History
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => { 
                setFormData({ 
                  reason: "", 
                  admissionDate: "", 
                  dischargeDate: "", 
                  hospital: "", 
                  doctor: "", 
                  ward: "", 
                  treatment: "", 
                  notes: "" 
                }); 
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
              {hospitalizationHistory.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No hospitalization records found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Get started by adding your first hospitalization record
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setFormData({ 
                        reason: "", 
                        admissionDate: "", 
                        dischargeDate: "", 
                        hospital: "", 
                        doctor: "", 
                        ward: "", 
                        treatment: "", 
                        notes: "" 
                      });
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
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Admission Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Discharge Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Hospital</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hospitalizationHistory.map((record, index) => (
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
                          <TableCell sx={{ fontWeight: 'medium' }}>{record.reason || "-"}</TableCell>
                          <TableCell>{formatDate(record.admissionDate)}</TableCell>
                          <TableCell>{formatDate(record.dischargeDate)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatus(record)} 
                              color={getStatusChipColor(record)}
                              size="small"
                            />
                          </TableCell>
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
              {editingIndex !== null ? "Edit" : "Add"} Hospitalization Record
            </Typography>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Reason for Hospitalization" 
              name="reason" 
              value={formData.reason} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.reason}
              helperText={openForm && !formData.reason ? "This field is required" : ""}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Admission Date"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="admissionDate" 
              value={formData.admissionDate} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.admissionDate}
              helperText={openForm && !formData.admissionDate ? "This field is required" : ""}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Discharge Date"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="dischargeDate" 
              value={formData.dischargeDate} 
              onChange={handleFormChange}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Hospital/Medical Center" 
              name="hospital" 
              value={formData.hospital} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.hospital}
              helperText={openForm && !formData.hospital ? "This field is required" : ""} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Attending Doctor" 
              name="doctor" 
              value={formData.doctor} 
              onChange={handleFormChange} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Ward/Room" 
              name="ward" 
              value={formData.ward} 
              onChange={handleFormChange} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Treatment/Procedures" 
              name="treatment" 
              value={formData.treatment} 
              onChange={handleFormChange}
              multiline 
              rows={2}
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
                disabled={!formData.reason || !formData.admissionDate || !formData.hospital}
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
                Hospitalization Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {selectedRecord.reason || "Unnamed Hospital Stay"}
                </Typography>
                <Chip 
                  label={getStatus(selectedRecord)} 
                  color={getStatusChipColor(selectedRecord)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Hospital Stay</Typography>
                <Typography variant="body1">
                  {formatDate(selectedRecord.admissionDate) || "Not specified"} 
                  {selectedRecord.dischargeDate ? ` to ${formatDate(selectedRecord.dischargeDate)}` : " (still admitted)"}
                </Typography>
                {selectedRecord.admissionDate && selectedRecord.dischargeDate && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Duration: {calculateDuration(selectedRecord.admissionDate, selectedRecord.dischargeDate)}
                  </Typography>
                )}
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Facility Information</Typography>
                <Typography variant="body1">
                  {selectedRecord.hospital || "Not specified"}
                </Typography>
                {selectedRecord.ward && (
                  <Typography variant="body1" color="textSecondary">
                    Ward/Room: {selectedRecord.ward}
                  </Typography>
                )}
                {selectedRecord.doctor && (
                  <Typography variant="body1" color="textSecondary">
                    Attending Doctor: Dr. {selectedRecord.doctor}
                  </Typography>
                )}
              </Paper>
              
              {selectedRecord.treatment && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Treatment/Procedures</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.treatment}
                  </Typography>
                </Paper>
              )}
              
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
                {selectedRecord && hospitalizationHistory.findIndex(r => 
                  r.reason === selectedRecord.reason && 
                  r.admissionDate === selectedRecord.admissionDate
                ) !== -1 && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const index = hospitalizationHistory.findIndex(r => 
                        r.reason === selectedRecord.reason && 
                        r.admissionDate === selectedRecord.admissionDate
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

export default HospitalizationHistory;