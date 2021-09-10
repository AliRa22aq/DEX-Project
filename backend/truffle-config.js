var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

module.exports = {
  contracts_directory: './contracts/',
  contracts_build_directory: '../src/abis/',
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, `https://ropsten.infura.io/${process.env.API_KEY}`)
      },
      network_id: 3,
      gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0",
    }
}

}
