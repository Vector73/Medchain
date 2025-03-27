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

const Allergies = () => {
  const [cookies, setCookie] = useCookies();
  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    allergen: "",
    reaction: "",
    severity: "",
    firstOccurrence: "",
    notes: "",
  });
  const [walletAddress, setWalletAddress] = useState("");

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
          if (data && data.allergies) {
              setAllergies(data.allergies);
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
      const newHash = await updateBlockchainUtil(walletAddress, {allergies: updatedHistory}, cookies["hash"])
    
      setCookie("hash", newHash, { path: "/" });
      setAllergies(updatedHistory);
    };

  const submit = async () => {
    // Form validation
    if (!formData.allergen || !formData.severity) {
      setError("Please fill in all required fields");
      return;
    }

    const updatedAllergies = editingIndex !== null
      ? allergies.map((rec, i) => (i === editingIndex ? formData : rec))
      : [...allergies, formData];
    
    try {
      await updateBlockchain(updatedAllergies);
      setOpenForm(false);
      setEditingIndex(null);
      setFormData({ allergen: "", reaction: "", severity: "", firstOccurrence: "", notes: "" });
    } catch (err) {
      setError("Failed to save allergy record. Please try again.");
      console.error(err);
    }
  };

  const editRecord = (index) => {
    setFormData(allergies[index]);
    setEditingIndex(index);
    setOpenForm(true);
  };

  const deleteRecord = async (index) => {
    if (window.confirm("Are you sure you want to delete this allergy record?")) {
      try {
        const updatedAllergies = allergies.filter((_, i) => i !== index);
        await updateBlockchain(updatedAllergies);
      } catch (err) {
        setError("Failed to delete allergy record. Please try again.");
        console.error(err);
      }
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const getSeverityChipColor = (severity) => {
    switch(severity.toLowerCase()) {
      case "severe": return "error";
      case "moderate": return "warning";
      case "mild": return "success";
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
              Allergies
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => { 
                setFormData({ allergen: "", reaction: "", severity: "", firstOccurrence: "", notes: "" }); 
                setEditingIndex(null);
                setOpenForm(true); 
              }}
            >
              Add Allergy
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
              {allergies.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No allergies recorded
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Add your allergies to help healthcare providers give you better care
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setFormData({ allergen: "", reaction: "", severity: "", firstOccurrence: "", notes: "" });
                      setOpenForm(true);
                    }}
                  >
                    Add First Allergy
                  </Button>
                </Paper>
              ) : (
                /* Table with allergies */
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Allergen</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Reaction</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Severity</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>First Occurrence</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allergies.map((record, index) => (
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
                          <TableCell sx={{ fontWeight: 'medium' }}>{record.allergen || "-"}</TableCell>
                          <TableCell>{record.reaction || "-"}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.severity || "Unknown"} 
                              color={getSeverityChipColor(record.severity)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(record.firstOccurrence)}</TableCell>
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
              {editingIndex !== null ? "Edit" : "Add"} Allergy Record
            </Typography>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Allergen" 
              name="allergen" 
              value={formData.allergen} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.allergen}
              helperText={openForm && !formData.allergen ? "This field is required" : ""}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="Reaction" 
              name="reaction" 
              value={formData.reaction} 
              onChange={handleFormChange}
            />
            
            <TextField 
              select 
              fullWidth 
              margin="normal" 
              label="Severity" 
              name="severity" 
              value={formData.severity} 
              onChange={handleFormChange}
              required
              error={openForm && !formData.severity}
              helperText={openForm && !formData.severity ? "Please select severity" : ""}
            >
              <MenuItem value="Mild">Mild</MenuItem>
              <MenuItem value="Moderate">Moderate</MenuItem>
              <MenuItem value="Severe">Severe</MenuItem>
            </TextField>
            
            <TextField 
              fullWidth 
              margin="normal" 
              label="First Occurrence"
              InputLabelProps={{ shrink: true }}
              type="date" 
              name="firstOccurrence" 
              value={formData.firstOccurrence} 
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
                disabled={!formData.allergen || !formData.severity}
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
                Allergy Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {selectedRecord.allergen || "Unnamed Allergen"}
                </Typography>
                {selectedRecord.severity && (
                  <Chip 
                    label={selectedRecord.severity} 
                    color={getSeverityChipColor(selectedRecord.severity)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              
              {selectedRecord.reaction && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Reaction</Typography>
                  <Typography variant="body1">{selectedRecord.reaction}</Typography>
                </Paper>
              )}
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">First Occurrence</Typography>
                <Typography variant="body1">{formatDate(selectedRecord.firstOccurrence) || "Not specified"}</Typography>
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
                {selectedRecord && allergies.findIndex(r => 
                  r.allergen === selectedRecord.allergen && 
                  r.severity === selectedRecord.severity
                ) !== -1 && (
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const index = allergies.findIndex(r => 
                        r.allergen === selectedRecord.allergen && 
                        r.severity === selectedRecord.severity
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

export default Allergies;