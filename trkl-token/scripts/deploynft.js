async function main() {
    const TrickleNFT = await ethers.getContractFactory("TrickleNFT");
    console.log("Deploying TrickleNFT...");

    const trickleNFT = await TrickleNFT.deploy();
    await trickleNFT.waitForDeployment();

    const address = await trickleNFT.getAddress();
    console.log("✅ TrickleNFT deployed to:", address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });