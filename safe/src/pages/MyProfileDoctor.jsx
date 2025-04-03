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
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import Sidebar2 from "../components/Sidebar2";

const MyProfileDoctor = () => {
  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(
    contract["abi"],
    contract["address"],
  );
  const [cookies, setCookie] = useCookies();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    medicalLicense: "",
    specialization: "",
    yearsOfExperience: "",
    qualifications: "",
    consultationFee: "",
    hospitalAffiliation: "",
    workingHours: "",
    languages: "",
    professionalSummary: "",
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
          firstName: data.name?.split(" ")[0] || "",
          lastName: data.name?.split(" ")[1] || "",
          email: data.mail || "",
          phone: data.phone || "",
          medicalLicense: data.medicalLicense || "",
          specialization: data.specialization || "",
          yearsOfExperience: data.yearsOfExperience || "",
          qualifications: data.qualifications || "",
          consultationFee: data.consultationFee || "",
          hospitalAffiliation: data.hospitalAffiliation || "",
          workingHours: data.workingHours || "",
          languages: data.languages || "",
          professionalSummary: data.professionalSummary || "",
        });
        setCookie(
          "name",
          `${data.name?.split(" ")[0]} ${data.name?.split(" ")[1]}`,
        );
        setCookie("email", data.email);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfile();
  }, []);

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
        medicalLicense: profile.medicalLicense,
        specialization: profile.specialization,
        yearsOfExperience: profile.yearsOfExperience,
        qualifications: profile.qualifications,
        consultationFee: profile.consultationFee,
        hospitalAffiliation: profile.hospitalAffiliation,
        workingHours: profile.workingHours,
        languages: profile.languages,
        professionalSummary: profile.professionalSummary,
      };

      const { cid } = await client.add(JSON.stringify(updatedData));
      const hash = cid.toString();
      await mycontract.methods.addDoctor(hash).send({ from: accounts[0] });
      setCookie("hash", hash);

      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
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
        <Sidebar2 />
      </div>
      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <Navbar />
        <div className="p-6 md:p-10">
          <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: "auto" }}>
            <Grid container spacing={3}>
              {/* Profile Image */}
              <Grid
                item
                xs={12}
                sm={4}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
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

              {/* Personal Details */}
              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  {[
                    { name: "firstName", label: "First Name", type: "text" },
                    { name: "lastName", label: "Last Name", type: "text" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "phone", label: "Phone", type: "tel" },
                    {
                      name: "medicalLicense",
                      label: "Medical License Number",
                      type: "text",
                    },
                    {
                      name: "specialization",
                      label: "Medical Specialization",
                      type: "select",
                      options: [
                        "General Practitioner",
                        "Cardiologist",
                        "Pediatrician",
                        "Neurologist",
                        "Orthopedic Surgeon",
                        "Dermatologist",
                        "Oncologist",
                        "Other",
                      ],
                    },
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
                        select={field.type === "select"}
                      >
                        {field.type === "select" &&
                          field.options.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                      </TextField>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Professional Details */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Professional Information
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  name: "yearsOfExperience",
                  label: "Years of Experience",
                  type: "number",
                },
                {
                  name: "qualifications",
                  label: "Qualifications",
                  type: "text",
                },
                {
                  name: "consultationFee",
                  label: "Consultation Fee (₹)",
                  type: "number",
                },
                {
                  name: "hospitalAffiliation",
                  label: "Hospital Affiliation",
                  type: "text",
                },
                { name: "workingHours", label: "Working Hours", type: "text" },
                { name: "languages", label: "Languages", type: "text" },
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
                  />
                </Grid>
              ))}
            </Grid>

            {/* Professional Summary */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Professional Summary
            </Typography>
            <TextField
              fullWidth
              name="professionalSummary"
              label="Professional Summary"
              value={profile.professionalSummary}
              onChange={handleChange}
              disabled={!editMode}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Briefly describe your professional background, expertise, and approach to patient care"
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
            Are you sure you want to discard the changes you've made to your
            profile?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>
            No, Continue Editing
          </Button>
          <Button color="error" onClick={handleConfirmCancel}>
            Yes, Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MyProfileDoctor;
