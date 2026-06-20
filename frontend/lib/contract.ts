import { ethers } from "ethers";
import { certificateRegistryABI } from "../constants/contract/CertificateRegistry";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

const getReadOnlyProvider = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.rpc.rockx.com";
  return new ethers.JsonRpcProvider(rpcUrl);
};

export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const sepoliaChainId = 11155111n; 

  if (network.chainId !== sepoliaChainId) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], 
      });
    } catch (switchError: any) {
      throw new Error("Please switch to the Sepolia Test Network in MetaMask.");
    }
  }

  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, certificateRegistryABI, signer);
};

export const issueCert = async (
  ipfsHash: string, 
  name: string, 
  matricule: string, 
  course: string, 
  university: string
) => {
  const contract = await getContract();
  const tx = await contract.issueCertificate(
    ipfsHash, 
    name, 
    matricule, 
    course, 
    university
  );
  return await tx.wait();
};

// New function to handle certificate revocation
export const revokeCert = async (ipfsHash: string) => {
  const contract = await getContract();
  const tx = await contract.revokeCertificate(ipfsHash);
  return await tx.wait();
};

export const verifyCert = async (hashOrCid: string) => {
  try {
    let targetIpfsHash = hashOrCid;

    if (hashOrCid.startsWith("0x") || hashOrCid.length === 64) {
      const response = await fetch(`/api/certificates/lookup?hash=${hashOrCid}`);
      const data = await response.json();
      
      if (data?.success && data.certificate?.ipfsHash) {
        targetIpfsHash = data.certificate.ipfsHash;
      } else {
        throw new Error("Certificate not found in local registry.");
      }
    }

    const provider = getReadOnlyProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, certificateRegistryABI, provider);

    // This returns: (string, string, string, string, uint256, bool)
    // result[5] is the 'isValid' status (exists && !revoked)
    const result = await contract.getCertificate(targetIpfsHash);

    if (!result || !result[5]) { 
      throw new Error("Certificate is either non-existent or has been revoked.");
    }

    return {
      studentName: result[0],
      matricule: result[1],
      course: result[2],
      university: result[3],
      date: Number(result[4]),
      isValid: result[5], 
      ipfsHash: targetIpfsHash
    };
  } catch (error) {
    console.error("Blockchain verification failed:", error);
    return null; 
  }
};