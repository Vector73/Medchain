import React, { useState, useEffect } from "react";
import Web3 from "web3";
import {
  Typography,
  Paper,
  Button,
  Chip,
  Modal,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  SearchOutlined,
  FilterListOutlined,
  MedicalInformationOutlined,
  EmailOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";

const Doctors = () => {
  const [cookies, setCookie] = useCookies();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState(new Set());
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [mycontract, setMyContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [specialities, setSpecialities] = useState([]);

  // Initialize web3 and contract
  useEffect(() => {
    async function initWeb3() {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          const contractInstance = new web3Instance.eth.Contract(
            contract["abi"],
            contract["address"]
          );

          setWeb3(web3Instance);
          setMyContract(contractInstance);
          setWalletAddress(accounts[0]);
        } else {
          setError("Please install MetaMask");
        }
      } catch (err) {
        setError("Failed to connect wallet");
        console.error(err);
      }
    }
    initWeb3();
  }, []);

  // Fetch doctors and apply filtering
  useEffect(() => {
    async function fetchDoctorsData() {
      if (!mycontract || !walletAddress) return;

      try {
        setLoading(true);
        const doctorAddresses = await mycontract.methods.getDoctors().call();
        const docList = [];
        const uniqueSpecialities = new Set();

        for (let address of doctorAddresses) {
          try {
            const doctorHash = await mycontract.methods
              .getDoctor(address)
              .call();
            const data = await (
              await fetch(`http://localhost:8080/ipfs/${doctorHash}`)
            ).json();
            data["hash"] = doctorHash;
            data["address"] = address;
            docList.push(data);
            uniqueSpecialities.add(data.speciality);
          } catch (addressError) {
            console.error(
              `Error fetching doctor data for address ${address}:`,
              addressError
            );
          }
        }

        setDoctors(docList);
        setFilteredDoctors(docList);
        setSpecialities(Array.from(uniqueSpecialities));

        // Get selected doctors for current patient
        const pHash = await mycontract.methods.getPatient(walletAddress).call();
        const patientData = await (
          await fetch(`http://localhost:8080/ipfs/${pHash}`)
        ).json();
        console.log(patientData.selectedDoctors);
        setSelectedDoctors(new Set(patientData.selectedDoctors || []));
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setError("Failed to fetch doctors");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctorsData();
  }, [mycontract, walletAddress, cookies]);

  // Search and Filter Effect
  useEffect(() => {
    const filtered = doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (specialityFilter === "" || doctor.speciality === specialityFilter)
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, specialityFilter, doctors]);

  const handleAddDoctor = async (doctor) => {
    try {
      const pHash = await mycontract.methods.getPatient(walletAddress).call();
      console.log(doctor);
      const patientData = await (
        await fetch(`http://localhost:8080/ipfs/${pHash}`)
      ).json();

      if (patientData.selectedDoctors?.includes(doctor.address)) {
        setError("Doctor already added");
        return;
      }

      patientData.selectedDoctors = patientData.selectedDoctors || [];
      patientData.selectedDoctors.push(doctor.address);

      const client = create(new URL("http://127.0.0.1:5001"));
      const { cid } = await client.add(JSON.stringify(patientData));
      const newHash = cid.toString();

      await mycontract.methods
        .addPatient(newHash)
        .send({ from: walletAddress });

      setSelectedDoctors(new Set([...selectedDoctors, doctor]));
      setCookie("hash", newHash);

      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error adding doctor:", error);
      setError("Failed to add doctor");
    }
  };

  const handleRemoveDoctor = async (doctor) => {
    try {
      const pHash = await mycontract.methods.getPatient(walletAddress).call();
      const patientData = await (
        await fetch(`http://localhost:8080/ipfs/${pHash}`)
      ).json();

      if (!patientData.selectedDoctors?.includes(doctor.address)) {
        setError("Doctor does not exist.");
        return;
      }

      patientData.selectedDoctors = patientData.selectedDoctors.filter((address) => address !== doctor.address)
      const client = create(new URL("http://127.0.0.1:5001"));
      const { cid } = await client.add(JSON.stringify(patientData));
      const newHash = cid.toString();

      await mycontract.methods
        .addPatient(newHash)
        .send({ from: walletAddress });

      setSelectedDoctors(new Set([...selectedDoctors, doctor]));
      setCookie("hash", newHash);

      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error adding doctor:", error);
      setError("Failed to add doctor");
    }
  };

  const getStatusChipColor = (isAdded) => {
    return isAdded ? "success" : "primary";
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
            <Typography
              variant="h4"
              component="h1"
              className="text-2xl font-bold"
            >
              Available Doctors
            </Typography>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={specialityFilter}
                onChange={(e) => setSpecialityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Specialities</option>
                {specialities.map((speciality) => (
                  <option key={speciality} value={speciality}>
                    {speciality}
                  </option>
                ))}
              </select>
              <FilterListOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Paper
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: "#ffebee",
                color: "#c62828",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
              {filteredDoctors.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No doctors found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                  >
                    There are currently no doctors matching your search
                  </Typography>
                </Paper>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <Paper
                      key={doctor.address}
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.03)",
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                          {doctor.name}
                        </Typography>
                        <Chip
                          label={
                            selectedDoctors.has(doctor.address)
                              ? "Added"
                              : "Available"
                          }
                          color={getStatusChipColor(
                            selectedDoctors.has(doctor.address)
                          )}
                          size="small"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <EmailOutlined fontSize="small" />
                          <Typography variant="body2">{doctor.mail}</Typography>
                        </div>
                        <div className="flex items-center space-x-2">
                          <WorkOutlineOutlined fontSize="small" />
                          <Typography variant="body2">
                            {doctor.speciality}
                          </Typography>
                        </div>
                      </div>
                    </Paper>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Doctor Details Modal */}
      <Modal open={!!selectedDoctor} onClose={() => setSelectedDoctor(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 450 },
            maxWidth: 450,
            bgcolor: "white",
            p: 4,
            borderRadius: "10px",
            boxShadow: 24,
          }}
        >
          <SimpleBar style={{ maxHeight: "80vh" }}>
            {selectedDoctor && (
              <>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                  Doctor Details
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{selectedDoctor.name}</Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedDoctor.mail}</Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Speciality
                  </Typography>
                  <Typography variant="body1">
                    {selectedDoctor.speciality}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={
                      selectedDoctors.has(selectedDoctor.address)
                        ? "Added"
                        : "Available"
                    }
                    color={getStatusChipColor(
                      selectedDoctors.has(selectedDoctor.address)
                    )}
                    size="small"
                  />
                </Paper>

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedDoctor(null)}
                  >
                    Close
                  </Button>
                  {!selectedDoctors.has(selectedDoctor.address) ? (
                    <Button
                      variant="contained"
                      onClick={() => handleAddDoctor(selectedDoctor)}
                    >
                      Add Doctor
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleRemoveDoctor(selectedDoctor)}
                    >
                      Remove Doctor
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

export default Doctors;
