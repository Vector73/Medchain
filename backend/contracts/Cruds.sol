// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Cruds {
    mapping(address => string) private patientCIDs;  // Maps a patient address to an array of CIDs
    mapping(address => string) private doctorCIDs;     // Maps a doctor address to a single CID

    function addDoctor(string memory doc_cid) public {
        doctorCIDs[msg.sender] = doc_cid;  // Each doctor has a unique CID
    }

    function getDoctor(address doctorAddress) public view returns (string memory) {
        return doctorCIDs[doctorAddress];  // Get doctor CID by address
    }

    function addPatient(string memory patient_cid) public {
        patientCIDs[msg.sender] = patient_cid;  // Append new CID for the patient
    }

    function getPatient(address patientAddress) public view returns (string memory) {
        return patientCIDs[patientAddress];  // Return all CIDs for a given patient
    }
}
