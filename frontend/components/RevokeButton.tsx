"use client"; 

import { useState } from "react";
import { revokeCert } from "@/lib/contract";
import { updateDatabaseRevocation } from "@/lib/actions";

export const RevokeButton = ({ ipfsHash }: { ipfsHash: string }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRevoke = async () => {
    if (!confirm("Are you sure? This will permanently mark the certificate as invalid.")) return;

    setIsProcessing(true);
    try {
      // 1. Try to revoke on the blockchain
      await revokeCert(ipfsHash);
      
      // 2. Sync DB on success
      await updateDatabaseRevocation(ipfsHash);
      alert("Success: Certificate revoked.");
      window.location.reload(); 
      
    } catch (error: any) {
      console.error("Revocation process error:", error);
      
      // 3. Fallback: If error indicates it's already revoked on-chain, sync DB anyway
      if (error.message?.includes("already revoked") || error.data?.message?.includes("already revoked")) {
        await updateDatabaseRevocation(ipfsHash);
        alert("Certificate was already revoked on-chain. Database has been synced.");
        window.location.reload();
      } else {
        alert("Error: " + (error.message || "Failed to revoke."));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleRevoke}
      disabled={isProcessing}
      className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors disabled:opacity-50"
    >
      {isProcessing ? "Processing..." : "Revoke"}
    </button>
  );
};