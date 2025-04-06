// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedChain {
    mapping(address => string) private patientCIDs;
    mapping(address => string) private doctorCIDs;
    address[] private patients;
    address[] private doctors;

    function addDoctor(string memory _cid) public {
        // Check if the doctor is not already in the array
        bool exists = false;
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == msg.sender) {
                exists = true;
                break;
            }
        }

        // If the doctor doesn't exist, add to the array
        if (!exists) {
            doctors.push(msg.sender);
        }
        
        // Update or set the doctor's CID
        doctorCIDs[msg.sender] = _cid;
    }

    function addPatient(string memory _cid) public {
        // Check if the patient is not already in the array
        bool exists = false;
        for (uint i = 0; i < patients.length; i++) {
            if (patients[i] == msg.sender) {
                exists = true;
                break;
            }
        }

        // If the patient doesn't exist, add to the array
        if (!exists) {
            patients.push(msg.sender);
        }
        
        // Update or set the patient's CID
        patientCIDs[msg.sender] = _cid;
    }

    function getDoctor(address doctorAddress) public view returns (string memory) {
        return doctorCIDs[doctorAddress];
    }

    function getPatient(address patientAddress) public view returns (string memory) {
        return patientCIDs[patientAddress];
    }

    function getPatients() public view returns (address[] memory) {
        return patients;
    }

    function getDoctors() public view returns (address[] memory) {
        return doctors;
    }
}