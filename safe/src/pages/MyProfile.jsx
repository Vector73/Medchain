import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Web3 from "web3";
import { useCookies } from "react-cookie";
import { create } from "ipfs-http-client";
import contract from "../contracts/contract.json";
import { 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Avatar, 
  IconButton, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon 
} from '@mui/icons-material';

const MyProfile = () => {
  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);
  const [cookies, setCookie] = useCookies();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    height: "",
    weight: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    address: "",
    medicalAlerts: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const hash = cookies["hash"];
        const res = await fetch(`http://localhost:8080/ipfs/${hash}`);
        const data = await res.json();
        
        // Map existing data to new profile structure
        setProfile({
          firstName: data.name?.split(' ')[0] || "",
          lastName: data.name?.split(' ')[1] || "",
          email: data.mail || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          bloodGroup: data.bloodGroup || "",
          height: data.height || "",
          weight: data.weight || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
          address: data.address || "",
          medicalAlerts: data.medicalAlerts || ""
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfile();
  }, [cookies]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const save = async () => {
    try {
      const accounts = await web3.eth.requestAccounts();
      const client = create(new URL("http://127.0.0.1:5001"));
      
      const res = await fetch(`http://localhost:8080/ipfs/${cookies["hash"]}`);
      let existingData = await res.json();
      
      // Prepare updated data
      const updatedData = {
        ...existingData,
        name: `${profile.firstName} ${profile.lastName}`,
        mail: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        height: profile.height,
        weight: profile.weight,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone,
        address: profile.address,
        medicalAlerts: profile.medicalAlerts
      };
      
      const { cid } = await client.add(JSON.stringify(updatedData));
      const hash = cid.toString();
      await mycontract.methods.addPatient(hash).send({ from: accounts[0] });
      setCookie("hash", hash);
      
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const cancelEdit = () => {
    setOpenConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setOpenConfirmDialog(false);
    setEditMode(false);
  };

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>
      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <Navbar />
        <div className="p-6 md:p-10">
          <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>
              My Profile
            </Typography>
            
            <Grid container spacing={3}>
              {/* Profile Image */}
              <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  alt="Profile Picture" 
                  src={profileImage || "/default-avatar.png"} 
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                {editMode && (
                  <Button 
                    variant="contained" 
                    component="label"
                    color="secondary"
                  >
                    Upload Photo
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                )}
              </Grid>
              
              {/* Profile Details */}
              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  {[
                    { name: "firstName", label: "First Name", type: "text" },
                    { name: "lastName", label: "Last Name", type: "text" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "phone", label: "Phone", type: "tel" },
                    { 
                      name: "gender", 
                      label: "Gender", 
                      type: "select", 
                      options: ["Male", "Female", "Other"] 
                    },
                    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
                  ].map((field) => (
                    <Grid item xs={12} sm={6} key={field.name}>
                      <TextField
                        fullWidth
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        value={profile[field.name]}
                        onChange={handleChange}
                        disabled={!editMode}
                        variant="outlined"
                        InputLabelProps={{ 
                          shrink: field.type === 'date' ? true : undefined 
                        }}
                        select={field.type === 'select'}
                      >
                        {field.type === 'select' && 
                          field.options.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))
                        }
                      </TextField>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Medical Details */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Medical Information</Typography>
            <Grid container spacing={2}>
              {[
                { name: "bloodGroup", label: "Blood Group", type: "select", 
                  options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
                { name: "height", label: "Height (cm)", type: "number" },
                { name: "weight", label: "Weight (kg)", type: "number" },
                { name: "medicalAlerts", label: "Medical Alerts", type: "text" }
              ].map((field) => (
                <Grid item xs={12} sm={6} key={field.name}>
                  <TextField
                    fullWidth
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    value={profile[field.name]}
                    onChange={handleChange}
                    disabled={!editMode}
                    variant="outlined"
                    select={field.type === 'select'}
                  >
                    {field.type === 'select' && 
                      field.options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))
                    }
                  </TextField>
                </Grid>
              ))}
            </Grid>

            {/* Emergency Contact */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Emergency Contact</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergencyContactName"
                  label="Emergency Contact Name"
                  value={profile.emergencyContactName}
                  onChange={handleChange}
                  disabled={!editMode}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="emergencyContactPhone"
                  label="Emergency Contact Phone"
                  value={profile.emergencyContactPhone}
                  onChange={handleChange}
                  disabled={!editMode}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Address */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Address</Typography>
            <TextField
              fullWidth
              name="address"
              label="Full Address"
              value={profile.address}
              onChange={handleChange}
              disabled={!editMode}
              variant="outlined"
              multiline
              rows={3}
            />

            {/* Edit/Save Buttons */}
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item>
                {!editMode ? (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<SaveIcon />}
                      onClick={save}
                      sx={{ mr: 2 }}
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      startIcon={<CancelIcon />}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to discard the changes you've made to your profile?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>
            No, Continue Editing
          </Button>
          <Button 
            color="error" 
            onClick={handleConfirmCancel}
          >
            Yes, Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MyProfile;