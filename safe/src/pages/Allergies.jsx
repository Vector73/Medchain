import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import contract from "../contracts/contract.json";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";
import {
    Modal,
    Box,
    Button,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    MenuItem,
    Typography,
    TableContainer,
    Paper,
} from "@mui/material";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { fetchData, updateBlockchainUtil } from "./components/util";

const Allergies = () => {
    const [cookies, setCookie] = useCookies();
    const web3 = new Web3(window.ethereum);
    const mycontract = new web3.eth.Contract(
        contract["abi"],
        contract["address"]
    );
    const [allergies, setAllergies] = useState([]);
    const [openForm, setOpenForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [formData, setFormData] = useState({
        allergen: "",
        reaction: "",
        severity: "",
        firstOccurrence: "",
        notes: "",
    });

    useEffect(() => {
        async function fetchAccount() {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            setWalletAddress(accounts[0]);
        }
        fetchAccount();
    }, []);

    useEffect(() => {
        async function fetchAllergies() {
            const { patientCID, data } = await fetchData(walletAddress);
            setCookie("hash", patientCID, { path: "/" });
            console.log(data)
            if (data && data.allergies) {
                setAllergies(data.allergies);
            }
        }
        fetchAllergies();
    }, [walletAddress, setCookie]);

    const handleFormChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const updateBlockchain = async (updatedAllergies) => {
        const newHash = await updateBlockchainUtil(
            walletAddress,
            { allergies: updatedAllergies },
            cookies["hash"]
        );

        setCookie("hash", newHash, { path: "/" });
        setAllergies(updatedAllergies);
    };

    const submit = async () => {
        const updatedAllergies =
            editingIndex !== null
                ? allergies.map((rec, i) =>
                      i === editingIndex ? formData : rec
                  )
                : [...allergies, formData];
        await updateBlockchain(updatedAllergies);
        setOpenForm(false);
        setEditingIndex(null);
        setFormData({
            allergen: "",
            reaction: "",
            severity: "",
            firstOccurrence: "",
            notes: "",
        });
    };

    const editRecord = (index) => {
        setFormData(allergies[index]);
        setEditingIndex(index);
        setOpenForm(true);
    };

    const deleteRecord = async (index) => {
        const updatedAllergies = allergies.filter((_, i) => i !== index);
        await updateBlockchain(updatedAllergies);
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
                <div
                    style={{
                        padding: "4rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={() => {
                            setFormData({
                                allergen: "",
                                reaction: "",
                                severity: "",
                                firstOccurrence: "",
                                notes: "",
                            });
                            setOpenForm(true);
                        }}
                    >
                        Add Allergy Record
                    </Button>

                    <TableContainer
                        component={Paper}
                        sx={{
                            width: "80%",
                            mt: 3,
                            borderRadius: 2,
                            maxHeight: 400,
                        }}
                    >
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Allergen</TableCell>
                                    <TableCell>Reaction</TableCell>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>First Occurrence</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allergies.map((record, index) => (
                                    <TableRow
                                        key={index}
                                        onClick={() => handleRowClick(record)}
                                    >
                                        <TableCell>{record.allergen}</TableCell>
                                        <TableCell>{record.reaction}</TableCell>
                                        <TableCell>{record.severity}</TableCell>
                                        <TableCell>
                                            {record.firstOccurrence}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    editRecord(index);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
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
                </div>
            </div>

            <Modal open={openForm} onClose={() => setOpenForm(false)}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "white",
                        p: 4,
                        borderRadius: "10px",
                    }}
                >
                    <SimpleBar style={{ maxHeight: "60vh" }}>
                        <h2>
                            {editingIndex !== null ? "Edit" : "Add"} Allergy
                            Record
                        </h2>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Allergen"
                            name="allergen"
                            value={formData.allergen}
                            onChange={handleFormChange}
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
                            fullWidth
                            margin="normal"
                            label="Severity"
                            name="severity"
                            value={formData.severity}
                            onChange={handleFormChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
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
                        <Button
                            variant="contained"
                            onClick={submit}
                            sx={{ mt: 2 }}
                        >
                            Save
                        </Button>
                    </SimpleBar>
                </Box>
            </Modal>
        </div>
    );
};

export default Allergies;
