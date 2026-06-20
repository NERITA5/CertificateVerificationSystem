"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { certificateRegistryABI, CONTRACT_ADDRESS } from "@/constants/contract/CertificateRegistry";
import { updateUniversityStatusInDb } from "@/app/actions/admin"; 

export default function AdminPanel() {
  const [universityAddress, setUniversityAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Get ENV variable and force string/lowercase
      const envAdmin = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "";
      const adminWallet = envAdmin.toLowerCase().trim();
      
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        const currentWallet = accounts[0] ? accounts[0].toLowerCase().trim() : "";

        console.log("--- ADMIN ACCESS DEBUG ---");
        console.log("Admin Wallet (from .env):", adminWallet);
        console.log("Current Wallet (MetaMask):", currentWallet);
        console.log("Do they match?", currentWallet === adminWallet);

        if (currentWallet && adminWallet && currentWallet === adminWallet) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    };
    
    checkAccess();
    window.ethereum?.on("accountsChanged", checkAccess);
    return () => window.ethereum?.removeListener("accountsChanged", checkAccess);
  }, []);

  const handleAuthorize = async () => {
    if (!isAdmin) return alert("Access Denied: You are not the system administrator.");
    if (!ethers.isAddress(universityAddress)) return alert("Please enter a valid Ethereum wallet address.");
    if (!window.ethereum) return alert("Please install MetaMask");

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, certificateRegistryABI, signer);

      const tx = await contract.authorizeIssuer(universityAddress);
      const receipt = await tx.wait(); 
      const txHash = receipt.hash;

      const dbResult = await updateUniversityStatusInDb(universityAddress, "APPROVED", txHash);

      if (!dbResult.success) {
        throw new Error("Blockchain succeeded, but database sync failed: " + dbResult.error);
      }

      alert("University authorized on-chain and database updated successfully!");
      setUniversityAddress(""); 
    } catch (error: any) {
      console.error("Authorization failed:", error);
      alert(error.message || "Authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-sm text-red-600 font-bold border border-red-200 bg-red-50 rounded-xl">
        Unauthorized Admin Access. 
        <br />
        Current Wallet does not match NEXT_PUBLIC_ADMIN_ADDRESS.
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-[#1B2559]">Authorize University</h2>
      <input 
        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
        placeholder="0x... University Wallet Address" 
        value={universityAddress}
        onChange={(e) => setUniversityAddress(e.target.value)} 
        disabled={loading}
      />
      <button 
        onClick={handleAuthorize}
        disabled={loading || !universityAddress}
        className="w-full bg-[#0052FF] text-white py-3 rounded-xl font-bold hover:bg-[#0041cc] transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Authorize Issuer"}
      </button>
    </div>
  );
}