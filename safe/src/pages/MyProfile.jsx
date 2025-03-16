/* eslint-disable */
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useCookies } from "react-cookie";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import { create } from "ipfs-http-client";

const MyProfile = () => {
  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(contract["abi"], contract["address"]);
  const [cookies, setCookie] = useCookies();
  const [profile, setProfile] = useState({ name: "", email: "", password: "" });
  const [editMode, setEditMode] = useState({ name: true, email: true, password: true });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const hash = cookies["hash"];
        const res = await fetch(`http://localhost:8080/ipfs/${hash}`);
        const data = await res.json();
        console.log(data)
        setProfile({ name: data.name || "", email: data.mail || "", password: data.password || "" });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfile();
  }, [cookies]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const toggleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
  };

  const save = async () => {
    try {
      const accounts = await web3.eth.requestAccounts();
      const client = create(new URL("http://127.0.0.1:5001"));
      
      const res = await fetch(`http://localhost:8080/ipfs/${cookies["hash"]}`);
      let existingData = await res.json();
      existingData = { ...existingData, name: profile.name, mail: profile.email, password: profile.password };
      
      const { cid } = await client.add(JSON.stringify(existingData));
      const hash = cid.toString();
      await mycontract.methods.addPatient(hash).send({ from: accounts[0] });
      setCookie("hash", hash);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar />
      </div>
      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
          <Navbar />
        </div>
        <div className="flex justify-center m-10">
          <form className="p-5 bg-slate-100 rounded-lg">
            <h1 className="text-center text-lg">User Profile</h1>

            {Object.keys(profile).map((field) => (
              <div key={field} className="py-2">
                <label className="text-black capitalize">
                  {field}:
                  <input
                    style={{ padding: "10px", margin: "10px", color: "black" }}
                    name={field}
                    type={field === "password" ? "password" : "text"}
                    value={profile[field]}
                    onChange={handleChange}
                    disabled={editMode[field]}
                    required
                  />
                </label>
                <button type="button" className="text-2xl hover:text-blue-400 cursor-pointer" onClick={() => toggleEdit(field)}>
                  ✎
                </button>
              </div>
            ))}

            <div className="py-2">
              <button type="button" onClick={save} className="bg-cyan-400 text-white font-medium p-3 rounded">
                Save
              </button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default MyProfile;
