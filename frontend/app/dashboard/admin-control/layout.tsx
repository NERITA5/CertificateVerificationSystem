"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDisconnected, setIsDisconnected] = useState(false);
  
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

  const checkAdmin = async () => {
    if (!window.ethereum) {
      setLoading(false);
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length === 0) {
        setIsDisconnected(true);
      } else {
        const connectedAccount = accounts[0].address.toLowerCase();
        setIsAdmin(connectedAccount === ADMIN_WALLET);
        setIsDisconnected(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdmin();
    window.ethereum?.on('accountsChanged', checkAdmin);
    return () => window.ethereum?.removeListener('accountsChanged', checkAdmin);
  }, [ADMIN_WALLET]);

  // Use a minimal wrapper so it doesn't conflict with parent layout CSS
  if (loading) return <div className="p-10">Authenticating Admin...</div>;
  if (isDisconnected) return <div className="p-10 text-orange-600">Please connect your Admin wallet in MetaMask.</div>;
  if (!isAdmin) return <div className="p-10 text-red-600 font-bold">Access Denied: You are not the authorized administrator.</div>;
  
  // Returning the children directly prevents extra DOM nodes that cause layout bugs
  return <>{children}</>;
}