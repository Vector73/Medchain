const fs = require("fs");
const path = require("path");
const MedChain = artifacts.require("MedChain");

module.exports = async function (deployer) {
  await deployer.deploy(MedChain);

  // 👇 After deployment, copy the contract JSON
  const artifactPath = path.join(__dirname, "../build/contracts/MedChain.json");
  const destinationPath = path.join(
    __dirname,
    "../../safe/src/contracts/contract.json",
  );
  const content = fs.readFileSync(artifactPath, "utf-8");
  const parsedContent = JSON.parse(content);
  fs.writeFileSync(
    destinationPath,
    JSON.stringify(
      {
        address: parsedContent.networks["1337"].address,
        abi: parsedContent.abi,
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.log("MedChain.json synced with frontend.");
};
