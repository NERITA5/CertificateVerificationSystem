import hre from "hardhat";

async function main() {
  console.log("Deploying CertificateRegistry to Sepolia...");

  // Accessing the injected ethers property via hre
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  
  const registry = await CertificateRegistry.deploy();

  console.log("Transaction sent! Waiting for confirmation...");
  await registry.waitForDeployment();

  const address = await registry.getAddress();

  console.log("--------------------------------------------------");
  console.log(`SUCCESS! Contract Address: ${address}`);
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});