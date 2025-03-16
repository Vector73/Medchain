const path = require("path");
const Web3 = require("web3");
const solc = require("solc");
const fs = require("fs");

// Connect to Ethereum node (Ganache)
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

// Use a relative path to the contract file
const contractPath = path.join(__dirname, "../backend/contracts/Cruds.sol");

// Read Solidity contract source code
const sourceCode = fs.readFileSync(contractPath, "utf8");

// Solidity Compiler Input
const input = {
    language: "Solidity",
    sources: {
        "Cruds.sol": { content: sourceCode }
    },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
};

// Compile Solidity Contract
const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
const contract = compiled.contracts["Cruds.sol"]["Cruds"];
const contractABI = contract.abi;
const bytecode = contract.evm.bytecode.object;

async function deployContract() {
    try {
        // Get available accounts
        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0]; // First account will deploy the contract

        console.log("Deploying from account:", deployer);

        // Create contract instance
        const contractInstance = new web3.eth.Contract(contractABI);

        // Deploy the contract
        const deployedContract = await contractInstance.deploy({
            data: bytecode
        }).send({
            from: deployer,
            gas: 4700000
        });

        console.log("Contract deployed at address:", deployedContract.options.address);
    } catch (error) {
        console.error("Deployment failed:", error);
    }
}

// Deploy the contract
deployContract();
