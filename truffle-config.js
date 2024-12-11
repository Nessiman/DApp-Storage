const path = require("path");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache RPC Server
      port: 7545,         // Port yang digunakan oleh Ganache
      network_id: "*",    // Menggunakan semua network ID
      gas: 6721975,       // Gas limit standar
      gasPrice: 20000000000, // Gas price standar
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",  // Sesuaikan dengan versi Solidity yang Anda gunakan
    },
  },
};
