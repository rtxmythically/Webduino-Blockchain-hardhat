import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PRC_URL = process.env.PRC_URL!;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY!;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    holesky: {
      url: PRC_URL,
      accounts: [PRIVATE_KEY],
      chainId:17000,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}

export default config;
