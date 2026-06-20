export const CONTRACT_ADDRESS = "0x98c3a9Fbba93a988a8bBb8148428093dd8A87890";

export const certificateRegistryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "certHash", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_university", "type": "address" }],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_certHash", "type": "string" }],
    "name": "getCertificate",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "matricule", "type": "string" },
      { "internalType": "string", "name": "course", "type": "string" },
      { "internalType": "string", "name": "university", "type": "string" },
      { "internalType": "uint256", "name": "date", "type": "uint256" },
      { "internalType": "bool", "name": "isValid", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_certHash", "type": "string" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_matricule", "type": "string" },
      { "internalType": "string", "name": "_course", "type": "string" },
      { "internalType": "string", "name": "_university", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_certHash", "type": "string" }],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;