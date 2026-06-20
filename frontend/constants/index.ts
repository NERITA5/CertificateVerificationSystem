"use client";

// Ensure your .env.local file contains NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_certHash", "type": "bytes32" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_course", "type": "string" },
      { "internalType": "string", "name": "_university", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_certHash", "type": "bytes32" }
    ],
    "name": "getCertificate",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "course", "type": "string" },
      { "internalType": "string", "name": "university", "type": "string" },
      { "internalType": "uint256", "name": "date", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "certHash", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  }
];