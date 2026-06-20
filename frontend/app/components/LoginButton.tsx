"use client";
import { useState } from "react";
import { ethers } from "ethers";

export default function LoginButton({ onLogin }: { onLogin: (address: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Check if the Ethereum provider exists on the window object
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    setLoading(true);
    try {
      // Connect to the provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        onLogin(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogin} 
      disabled={loading}
      className="bg-[#0052FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
    >
      {loading ? "Connecting..." : "Connect University Wallet"}
    </button>
  );
}