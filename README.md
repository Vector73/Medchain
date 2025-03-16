# MedChain - Project Setup Guide

## Prerequisites
Before setting up the project, ensure that you have the following installed:

1. **Ganache** - A personal Ethereum blockchain for development.
2. **Truffle** - A development framework for Ethereum smart contracts.
3. **IPFS** - A decentralized storage system for managing files.
4. **MetaMask** - A browser extension for managing Ethereum accounts and connecting to the blockchain.

## Installation and Setup

### 1. Install Ganache
Ganache is required to simulate a blockchain locally.

- Download and install Ganache from: [Ganache Download](https://trufflesuite.com/ganache/)
- Start Ganache and create a new workspace if necessary.

### 2. Install Truffle
Truffle helps in compiling and deploying smart contracts.

Run the following command:
```sh
npm install -g truffle
```

### 3. Install IPFS
IPFS is used for decentralized file storage.

- Download and install the **IPFS Desktop GUI** from: [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
- Open the IPFS Desktop application and ensure it is running.

### 4. Project Structure
The project consists of two main directories:

- **`safe/`** - The frontend React application.
- **`backend/`** - The Solidity smart contracts and blockchain-related logic.

### 5. Install Dependencies
Navigate to both `safe/` and `backend/` directories and install dependencies using:

```sh
npm install --legacy-peer-deps
```

### 6. Setup MetaMask
MetaMask is needed to interact with the Ethereum blockchain.

1. Install the [MetaMask Extension](https://metamask.io/download/) for your browser.
2. Open MetaMask and select **Import Account**.
3. Copy the first private key from Ganache and paste it into MetaMask’s **Import Account** section.

### 7. Run Ganache
Start Ganache and keep it running to simulate the blockchain.

### 8. Run IPFS
Ensure IPFS is running by opening the **IPFS Desktop GUI**.

### 9. Compile and Migrate Smart Contracts
Navigate to the `backend/` directory and run:

```sh
truffle compile
truffle migrate --reset
```

This will compile and deploy the smart contracts to the local blockchain (Ganache).

### 10. Configure MetaMask Network
After running Ganache, configure MetaMask to use the local blockchain:

- Open MetaMask.
- Click on **Networks** > **Add Network**.
- Set the following values:
  - **Network Name**: Ganache
  - **New RPC URL**: `http://127.0.0.1:8545`
  - **Chain ID**: `1337`
  - **Currency Symbol**: ETH

### 11. Start the Frontend Application
Navigate to the `safe/` directory and start the frontend:

```sh
npm start
```

This will launch the application in the browser.

## Summary
By following the above steps, you will have successfully set up and run the MedChain project, integrating blockchain and decentralized storage with a React frontend.

