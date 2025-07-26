import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with address:", deployer.address);

    const initialSupply = ethers.parseUnits("1000000", 18); // 1 million TRKL

    const TRKL = await ethers.getContractFactory("TRKLToken");
    const trkl = await TRKL.deploy(initialSupply);

    await trkl.waitForDeployment();
    console.log("TRKL Token deployed to:", await trkl.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});