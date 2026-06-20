import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
    console.log("--- Starting Pure Ethers Deployment ---");

    // 1. Setup Provider and Wallet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    console.log(`Deploying using wallet: ${wallet.address}`);

    // 2. Load the Artifact (Hardhat generates this when you compile)
    const artifactPath = "./artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json";
    
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Artifact not found! Please run 'npx hardhat compile' first.");
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // 3. Create Contract Factory and Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    console.log("Sending deployment transaction to Sepolia...");
    const contract = await factory.deploy();
    
    console.log("Transaction hash:", contract.deploymentTransaction()?.hash);
    console.log("Waiting for block confirmations...");
    
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("--------------------------------------------------");
    console.log(`SUCCESS! CertificateRegistry live at: ${address}`);
    console.log("--------------------------------------------------");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});