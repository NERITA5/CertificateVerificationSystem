"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { verifyUniversityAccess } from "@/app/actions/auth";
import { Building2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");

      // 1. Request access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 2. Fetch the CURRENTLY SELECTED account
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      const address = accounts[0].toLowerCase();

      // 3. Perform Database Authorization Check
      const auth = await verifyUniversityAccess(address);

      if (auth.success) {
        // 4. Create the session
        const response = await fetch('/api/auth/login', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }) 
        });

        if (response.ok) {
            router.push('/dashboard');
            router.refresh();
        } else {
            throw new Error("Failed to establish session.");
        }
      } else {
        alert("Access Denied: Wallet not authorized. Please ensure you have applied.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      const message = err.code === 4001 ? "Connection rejected by user." : (err.message || "Connection failed.");
      alert("Error: " + message);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F4F7FE]">
      <div className="bg-white p-10 rounded-3xl shadow-xl border w-96 text-center">
        <Building2 className="mx-auto mb-4 text-[#0052FF]" size={48} />
        <h1 className="text-2xl font-bold text-[#1B2559] mb-2">University Login</h1>
        <p className="text-slate-500 mb-8 text-sm">Connect your wallet to access the secure portal.</p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#0052FF] text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Connect Wallet"}
        </button>

        {/* Registration Link Added Here */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Don't have an account?{" "}
            <Link 
              href="/onboarding" 
              className="text-[#0052FF] font-bold hover:underline"
            >
              Register your university here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}