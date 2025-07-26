import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export default {
    solidity: "0.8.20",
    networks: {
        saga: {
            url: process.env.SAGA_RPC,
            chainId: 2743824585691000,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
};