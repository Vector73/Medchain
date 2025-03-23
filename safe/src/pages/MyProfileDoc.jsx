import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar2 from "../components/Sidebar2";
import Footer from "../components/Footer";
import { useCookies } from 'react-cookie';
import Web3 from "web3";
import contract from '../contracts/contract.json';

const MyProfileDoc = () => {
  const [cookies, setCookie] = useCookies();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseno, setLicenseno] = useState("");
  const [disabled, setDisabled] = useState(true);

  const web3 = new Web3(window.ethereum);
  const mycontract = new web3.eth.Contract(contract.abi, contract.address);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const hash = cookies['hash'];
        if (!hash) return;

        const response = await fetch(`http://localhost:8080/ipfs/${hash}`);
        const data = await response.json();
        console.log(data)
        setName(data.name || "");
        setEmail(data.mail || "");
        setPassword(data.password || "");
        setLicenseno(data.license || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [cookies]);

  // Sync auth object with state changes
  const [auth, setAuth] = useState({});
  useEffect(() => {
    setAuth({
      type: "user",
      name,
      mail: email,
      password,
      license: licenseno,
    });
  }, [name, email, password, licenseno]);

  const toggleEdit = () => setDisabled(!disabled);

  const save = async () => {
    try {
      setCookie("name", name);
      setCookie("mail", email);
      setCookie("password", password);
      setCookie("licenseno", licenseno);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAddress = accounts[0];

      await mycontract.methods
        .updateData(parseInt(cookies['index']), JSON.stringify(auth))
        .send({ from: currentAddress });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
        <Sidebar2 />
      </div>

      <div className="dark:bg-main-dark-bg bg-main-bg min-h-screen ml-72 w-full">
        <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
          <Navbar />
        </div>

        <div className="flex justify-center m-10">
          <form className="p-5">
            <h1 className="text-center text-lg">User Profile</h1>

            {[
              { label: "Name", value: name, setter: setName, type: "text" },
              { label: "Email", value: email, setter: setEmail, type: "email" },
              { label: "Password", value: password, setter: setPassword, type: "password" },
              { label: "License No.", value: licenseno, setter: setLicenseno, type: "text" }
            ].map(({ label, value, setter, type }) => (
              <div className="py-2" key={label}>
                <label className="text-black">
                  {label}:
                  <input
                    style={{ padding: "10px", margin: "10px", color: "black" }}
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    disabled={disabled}
                    required
                  />
                </label>
                <button type="button" onClick={toggleEdit} className="ml-2">✎</button>
              </div>
            ))}

            <div className="py-2">
              <button type="button" onClick={save} className="bg-cyan-400 text-white font-medium p-3">
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

export default MyProfileDoc;
