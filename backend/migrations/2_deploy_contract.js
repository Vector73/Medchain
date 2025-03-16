var Cruds = artifacts.require("Cruds");

module.exports = function(deployer) {
  // Deploy the Cruds contract as our only task
  deployer.deploy(Cruds);
};