async function main() {
    // Get the deployed contract
    const CONTRACT_ADDRESS = "0x61C2885D412751e332761a17E10bf5F7485679c2"; // Replace with your deployed address
    const TrickleNFT = await ethers.getContractFactory("TrickleNFT");
    const trickleNFT = await TrickleNFT.attach(CONTRACT_ADDRESS);

    // Address to mint the NFT to
    const recipientAddress = "0x9369d176081C548c9E72997e61A03E0e6DB94697"; // Replace with recipient's address

    console.log("Minting NFT...");
    const tx = await trickleNFT.mint(recipientAddress);
    await tx.wait();

    console.log("NFT minted successfully!");
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });