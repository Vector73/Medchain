// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Cruds {
    string[] doctors;
    string[] patients;

    function addDoctor(string memory doc_cid) public {
        for (uint i = 0; i < doctors.length; i++) {
            string memory x = doctors[i];
            if (keccak256(bytes(x)) == keccak256(bytes(doc_cid))) return;
        }
        doctors.push(doc_cid);
    }

    function getDoctor() public view returns (string[] memory) {
        return doctors;
    }

    function addPatient(string memory patient_cid) public {
        uint index = patients.length;
        
        // Check if the CID already exists and get its index
        for (uint i = 0; i < patients.length; i++) {
            if (keccak256(bytes(patients[i])) == keccak256(bytes(patient_cid))) {
                index = i;
                break;
            }
        }

        // Shift all elements to remove the existing hash
        for (uint i = index; i < patients.length - 1; i++) {
            patients[i] = patients[i + 1];
        }


        // Add the new CID at the end
        patients.push(patient_cid);
    }

    function getPatient() public view returns (string[] memory) {
        return patients;
    }
}