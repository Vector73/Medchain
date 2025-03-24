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

const CheckupHistory = () => {
  const [cookies, setCookie] = useCookies();
  const [web3, setWeb3] = useState(null);
  const [mycontract, setMyContract] = useState(null);
  const [checkupHistory, setCheckupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    checkupType: "",
    date: "",
    doctor: "",
    facility: "",
    findings: "",
    recommendations: "",
    followUpDate: "",
    vitalSigns: "",
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
    async function fetchCheckupHistory() {
      const {patientCID, data} = await fetchData(walletAddress);
      setCookie("hash", patientCID, { path: "/" });
      if (data && data.checkuphistory) {
        setCheckupHistory(data.checkuphistory);
      }
    }
    setLoading(true);
    fetchCheckupHistory();
    setLoading(false);
  }, [walletAddress, setCookie]);
  
  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const updateBlockchain = async (updatedHistory) => {
    const newHash = await updateBlockchainUtil(walletAddress, {checkuphistory: updatedHistory}, cookies["hash"]);
    setCookie("hash", newHash, { path: "/" });
    setCheckupHistory(updatedHistory);
  };

  const submit = async () => {
    // Form validation
    if (!formData.checkupType || !formData.date) {
      setError("Please fill in all required fields");
      return;
    }

    const updatedHistory = editingIndex !== null
      ? checkupHistory.map((rec, i) => (i === editingIndex ? formData : rec))
      : [...checkupHistory, formData];
    
    await updateBlockchain(updatedHistory);
    setOpenForm(false);
    setEditingIndex(null);
    setFormData({ 
      checkupType: "",
      date: "",
      doctor: "",
      facility: "",
      findings: "",
      recommendations: "",
      followUpDate: "",
      vitalSigns: "",
      notes: ""
    });
  };

  const editRecord = (index) => {
    setFormData(checkupHistory[index]);
    setEditingIndex(index);
    setOpenForm(true);
  };

  const deleteRecord = async (index) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedHistory = checkupHistory.filter((_, i) => i !== index);
      await updateBlockchain(updatedHistory);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const getCheckupTypeChipColor = (checkupType) => {
    switch(checkupType) {
      case "Annual Physical": return "success";
      case "Follow-up": return "info";
      case "Specialist Consultation": return "warning";
      case "Preventive Screening": return "secondary";
      case "Vaccination": return "primary";
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

  const calculateUpcomingFollowUp = (followUpDate) => {
    if (!followUpDate) return null;
    
    try {
      const followUp = new Date(followUpDate);
      const today = new Date();
      
      if (followUp < today) return null;
      
      const diffTime = Math.abs(followUp - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 30; // Returns true if follow-up is within 30 days
    } catch (e) {
      return null;
    }
  };

  const isRecentCheckup = (date) => {
    if (!date) return false;
    
    try {
      const checkupDate = new Date(date);
      const today = new Date();
      
      const diffTime = Math.abs(today - checkupDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 14; // Returns true if checkup was within last 14 days
    } catch (e) {
      return false;
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
              Checkup & Appointment History
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => { 
                setFormData({
                  checkupType: "",
                  date: "",
                  doctor: "",
                  facility: "",
                  findings: "",
                  recommendations: "",
                  followUpDate: "",
                  vitalSigns: "",
                  notes: ""
                }); 
                setEditingIndex(null);
                setOpenForm(true); 
              }}
            >
              Add Checkup
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
              {checkupHistory.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No checkup records found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Get started by adding your first checkup record
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setFormData({
                        checkupType: "",
                        date: "",
                        doctor: "",
                        facility: "",
                        findings: "",
                        recommendations: "",
                        followUpDate: "",
                        vitalSigns: "",
                        notes: ""
                      });
                      setOpenForm(true);
                    }}
                  >
                    Add First Checkup
                  </Button>
                </Paper>
              ) : (
                /* Table with records */
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Checkup Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Facility</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Follow-up</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {checkupHistory
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                        .map((record, index) => (
                        <TableRow 
                          key={index} 
                          onClick={() => handleRowClick(record)} 
                          sx={{ 
                            cursor: "pointer", 
                            transition: "background 0.2s", 
                            "&:hover": { backgroundColor: "#f0f7ff" },
                            "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                            ...(isRecentCheckup(record.date) ? { borderLeft: '4px solid #4caf50' } : {})
                          }}
                        >
                          <TableCell>
                            <Chip 
                              label={record.checkupType || "General Checkup"} 
                              color={getCheckupTypeChipColor(record.checkupType)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>{record.doctor || "-"}</TableCell>
                          <TableCell>{record.facility || "-"}</TableCell>
                          <TableCell>
                            {record.followUpDate ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {formatDate(record.followUpDate)}
                                {calculateUpcomingFollowUp(record.followUpDate) && (
                                  <Chip 
                                    label="Upcoming" 
                                    color="warning"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              "-"
                            )}
                          </TableCell>
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
              {editingIndex !== null ? "Edit" : "Add"} Checkup Record
            </Typography>
            
            <TextField 
              select
              fullWidth 
              margin="normal" 
              label="Checkup Type" 
              name="checkupType" 
              value={formData.checkupType} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.checkupType}
              helperText={openForm && !formData.checkupType ? "This field is required" : ""}
            >
              <MenuItem value="Annual Physical">Annual Physical</MenuItem>
              <MenuItem value="Follow-up">Follow-up</MenuItem>
              <MenuItem value="Specialist Consultation">Specialist Consultation</MenuItem>
              <MenuItem value="Preventive Screening">Preventive Screening</MenuItem>
              <MenuItem value="Vaccination">Vaccination</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Checkup Date"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.date}
              helperText={openForm && !formData.date ? "This field is required" : ""}
            />
            
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
              label="Healthcare Facility" 
              name="facility" 
              value={formData.facility} 
              onChange={handleFormChange} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Vital Signs (BP, HR, etc.)" 
              name="vitalSigns" 
              value={formData.vitalSigns} 
              onChange={handleFormChange} 
              multiline 
              rows={2} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Findings" 
              name="findings" 
              value={formData.findings} 
              onChange={handleFormChange} 
              multiline 
              rows={2} 
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Recommendations" 
              name="recommendations" 
              value={formData.recommendations} 
              onChange={handleFormChange}
              multiline 
              rows={2}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Follow-up Date (if any)"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="followUpDate" 
              value={formData.followUpDate} 
              onChange={handleFormChange}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Additional Notes" 
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
                disabled={!formData.checkupType || !formData.date}
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
                Checkup Details
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="primary">
                  {selectedRecord.checkupType || "General Checkup"}
                </Typography>
                <Chip 
                  label={formatDate(selectedRecord.date)}
                  color="default"
                  size="small"
                />
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Healthcare Provider</Typography>
                <Typography variant="body1">
                  {selectedRecord.doctor ? `Dr. ${selectedRecord.doctor}` : "Not specified"}
                </Typography>
                {selectedRecord.facility && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Facility: {selectedRecord.facility}
                  </Typography>
                )}
              </Paper>
              
              {selectedRecord.vitalSigns && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Vital Signs</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.vitalSigns}
                  </Typography>
                </Paper>
              )}
              
              {selectedRecord.findings && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Findings</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.findings}
                  </Typography>
                </Paper>
              )}
              
              {selectedRecord.recommendations && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Recommendations</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.recommendations}
                  </Typography>
                </Paper>
              )}
              
              {selectedRecord.followUpDate && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Follow-up Appointment</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {formatDate(selectedRecord.followUpDate)}
                    </Typography>
                    {calculateUpcomingFollowUp(selectedRecord.followUpDate) && (
                      <Chip 
                        label="Upcoming" 
                        color="warning"
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>
                </Paper>
              )}
              
              {selectedRecord.notes && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Additional Notes</Typography>
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
                {selectedRecord && checkupHistory.findIndex(r => 
                  r.checkupType === selectedRecord.checkupType && 
                  r.date === selectedRecord.date
                ) !== -1 && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const index = checkupHistory.findIndex(r => 
                        r.checkupType === selectedRecord.checkupType && 
                        r.date === selectedRecord.date
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

export default CheckupHistory;