import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import { useCookies } from "react-cookie";
import { 
  Modal, Box, Button, TextField, Table, TableHead, TableRow, 
  TableCell, TableBody, MenuItem, Typography, TableContainer, 
  Paper, Chip, CircularProgress 
} from "@mui/material";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { fetchData, updateBlockchainUtil } from "./components/util";

const InsuranceRecords = () => {
  const [cookies, setCookie] = useCookies();
  const [insuranceRecords, setInsuranceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [formData, setFormData] = useState({
    provider: "",
    policyNumber: "",
    type: "",
    startDate: "",
    endDate: "",
    coverageAmount: "",
    premiumAmount: "",
    status: "",
    notes: ""
  });

  // Initialize wallet connection
  useEffect(() => {
    async function fetchAccount() {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    }
    fetchAccount();
  }, []);

  // Fetch insurance records
  useEffect(() => {
    async function fetchInsuranceRecords() {
      const {patientCID, data} = await fetchData(walletAddress);
      setCookie("hash", patientCID, { path: "/" });
      if (data && data.insuranceRecords) {
        setInsuranceRecords(data.insuranceRecords);
      }
      setLoading(false);
    }
    
    if (walletAddress) {
      fetchInsuranceRecords();
    }
  }, [walletAddress, setCookie]);
  
  const handleFormChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const updateBlockchain = async (updatedRecords) => {
    const newHash = await updateBlockchainUtil(walletAddress, {insuranceRecords: updatedRecords}, cookies["hash"])
  
    setCookie("hash", newHash, { path: "/" });
    setInsuranceRecords(updatedRecords);
  };

  const submit = async () => {
    // Form validation
    if (!formData.provider || !formData.policyNumber || !formData.type || !formData.status) {
      setError("Please fill in all required fields");
      return;
    }

    const updatedRecords = editingIndex !== null
      ? insuranceRecords.map((rec, i) => (i === editingIndex ? formData : rec))
      : [...insuranceRecords, formData];
    
    await updateBlockchain(updatedRecords);
    setOpenForm(false);
    setEditingIndex(null);
    setFormData({
      provider: "",
      policyNumber: "",
      type: "",
      startDate: "",
      endDate: "",
      coverageAmount: "",
      premiumAmount: "",
      status: "",
      notes: ""
    });
  };

  const editRecord = (index) => {
    setFormData(insuranceRecords[index]);
    setEditingIndex(index);
    setOpenForm(true);
  };

  const deleteRecord = async (index) => {
    if (window.confirm("Are you sure you want to delete this insurance record?")) {
      const updatedRecords = insuranceRecords.filter((_, i) => i !== index);
      await updateBlockchain(updatedRecords);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const getStatusChipColor = (status) => {
    switch(status) {
      case "Active": return "success";
      case "Expired": return "error";
      case "Pending": return "warning";
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

  const formatCurrency = (amount) => {
    return amount ? `$${parseFloat(amount).toLocaleString()}` : "-";
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
              Insurance Records
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => { 
                setFormData({
                  provider: "",
                  policyNumber: "",
                  type: "",
                  startDate: "",
                  endDate: "",
                  coverageAmount: "",
                  premiumAmount: "",
                  status: "",
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
              {insuranceRecords.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No insurance records found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Get started by adding your first insurance record
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setFormData({
                        provider: "",
                        policyNumber: "",
                        type: "",
                        startDate: "",
                        endDate: "",
                        coverageAmount: "",
                        premiumAmount: "",
                        status: "",
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
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Insurance Provider</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Policy Number</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Start Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insuranceRecords.map((record, index) => (
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
                          <TableCell sx={{ fontWeight: 'medium' }}>{record.provider || "-"}</TableCell>
                          <TableCell>{record.policyNumber || "-"}</TableCell>
                          <TableCell>{record.type || "-"}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.status || "Unknown"} 
                              color={getStatusChipColor(record.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(record.startDate)}</TableCell>
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
              {editingIndex !== null ? "Edit" : "Add"} Insurance Record
            </Typography>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Insurance Provider" 
              name="provider" 
              value={formData.provider} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.provider}
              helperText={openForm && !formData.provider ? "This field is required" : ""}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Policy Number" 
              name="policyNumber" 
              value={formData.policyNumber} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.policyNumber}
              helperText={openForm && !formData.policyNumber ? "This field is required" : ""}
            />
            
            <TextField 
              select 
              fullWidth 
              margin="normal" 
              label="Insurance Type" 
              name="type" 
              value={formData.type} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.type}
              helperText={openForm && !formData.type ? "Please select an insurance type" : ""}
            >
              <MenuItem value="Health">Health</MenuItem>
              <MenuItem value="Life">Life</MenuItem>
              <MenuItem value="Dental">Dental</MenuItem>
              <MenuItem value="Vision">Vision</MenuItem>
              <MenuItem value="Disability">Disability</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            
            <TextField 
              select 
              fullWidth 
              margin="normal" 
              label="Status" 
              name="status" 
              value={formData.status} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.status}
              helperText={openForm && !formData.status ? "Please select a status" : ""}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </TextField>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                fullWidth 
                margin="normal" 
                label="Start Date"
                type="date"
                name="startDate" 
                value={formData.startDate} 
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField 
                fullWidth 
                margin="normal" 
                label="End Date"
                type="date"
                name="endDate" 
                value={formData.endDate} 
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                fullWidth 
                margin="normal" 
                label="Coverage Amount" 
                name="coverageAmount" 
                value={formData.coverageAmount} 
                onChange={handleFormChange}
                type="number"
                InputProps={{
                  startAdornment: <span>$</span>,
                }}
              />
              
              <TextField 
                fullWidth 
                margin="normal" 
                label="Premium Amount" 
                name="premiumAmount" 
                value={formData.premiumAmount} 
                onChange={handleFormChange}
                type="number"
                InputProps={{
                  startAdornment: <span>$</span>,
                }}
              />
            </Box>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleFormChange} 
              multiline 
              rows={3} 
              placeholder="Additional details about the insurance policy"
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
                disabled={!formData.provider || !formData.policyNumber || !formData.type || !formData.status}
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
        <SimpleBar style={{ maxHeight: "80vh" }}>
          {selectedRecord && (
            <>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                Insurance Record Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {selectedRecord.provider || "Unnamed Insurance"}
                </Typography>
                {selectedRecord.status && (
                  <Chip 
                    label={selectedRecord.status} 
                    color={getStatusChipColor(selectedRecord.status)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Policy Details</Typography>
                <Typography variant="body1">
                  {selectedRecord.policyNumber || "Not specified"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedRecord.type || ""}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Policy Period</Typography>
                <Typography variant="body1">
                  {formatDate(selectedRecord.startDate)} - {formatDate(selectedRecord.endDate)}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Coverage Amount</Typography>
                  <Typography variant="body1">{formatCurrency(selectedRecord.coverageAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Premium</Typography>
                  <Typography variant="body1">{formatCurrency(selectedRecord.premiumAmount)}</Typography>
                </Box>
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
                {selectedRecord && insuranceRecords.findIndex(r => 
                  r.provider === selectedRecord.provider && 
                  r.policyNumber === selectedRecord.policyNumber
                ) !== -1 && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const index = insuranceRecords.findIndex(r => 
                        r.provider === selectedRecord.provider && 
                        r.policyNumber === selectedRecord.policyNumber
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
        </SimpleBar>
        </Box>
      </Modal>
    </div>
  );
};

export default InsuranceRecords;