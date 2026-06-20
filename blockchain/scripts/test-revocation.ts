async function main() {
  const contractAddress = "0x98c3a9Fbba93a988a8bBb8148428093dd8A87890";
  
  // Get the contract factory
  const Registry = await ethers.getContractFactory("CertificateRegistry");
  
  // Attach to the deployed contract
  const registry = await Registry.attach(contractAddress);

  console.log("--- Testing Revocation ---");

  // 1. Authorize the admin account as an issuer
  const [admin] = await ethers.getSigners();
  console.log("Authorizing issuer:", admin.address);
  const txAuth = await registry.authorizeIssuer(admin.address);
  await txAuth.wait();
  console.log("Account authorized as issuer.");

  // 2. Issue a test certificate
  const certHash = "test-hash-123";
  console.log("Issuing certificate...");
  const txIssue = await registry.issueCertificate(
    certHash, 
    "John Doe", 
    "12345", 
    "Computer Science", 
    "University of Buea"
  );
  await txIssue.wait();
  console.log("Certificate issued.");

  // 3. Verify it is valid
  let cert = await registry.getCertificate(certHash);
  console.log("Initial validity check (should be true):", cert.isValid); 

  // 4. Revoke it
  console.log("Revoking certificate...");
  const txRevoke = await registry.revokeCertificate(certHash);
  await txRevoke.wait();
  console.log("Certificate revoked.");

  // 5. Check again
  cert = await registry.getCertificate(certHash);
  console.log("Post-revocation validity check (should be false):", cert.isValid);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });