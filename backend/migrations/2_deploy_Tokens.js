const DEX = artifacts.require("DEX")

module.exports = async function (deployer, network, accounts) {
  // Deploy MyToken
  await deployer.deploy(DEX)
  const dexContract = await DEX.deployed()
  
}
