import * as dotenv from "dotenv";
dotenv.config();

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ganache";
import "hardhat-watcher";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-etherscan";

const config = {
  Runs: 5,
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000000,
  },
  networks: {
    hardhat: {},
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/ZFAVZvZ_Ce3LRPbJx7STIAP111xHbquk`,
      accounts: [process.env.PRIVATE_KEY_DEV],
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/ZFAVZvZ_Ce3LRPbJx7STIAP111xHbquk`,
      accounts: [process.env.PRIVATE_KEY_DEV],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.PRIVATE_KEY_MAIN],
    },
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY,
  },
  watcher: {
    ci: {
      tasks: [
        "clean",
        { command: "compile", params: { quiet: true } },
        {
          command: "test",
          params: { noCompile: true, testFiles: ["test/testfile.js"] },
        },
      ],
    },
  },
};
export default config;
