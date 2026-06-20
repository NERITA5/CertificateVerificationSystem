"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { certificateRegistryABI, CONTRACT_ADDRESS } from "@/constants/contract/CertificateRegistry";
import { updateUniversityStatusInDb } from "@/app/actions/admin";
import { getPendingApplications } from "@/app/actions/fetch";

export default function AdminPage() {
  const [universityAddress, setUniversityAddress] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminAccess = async () => {
    const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase().trim();
    
    if (!window.ethereum) return;
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    const currentAccount = accounts[0]?.toLowerCase().trim();

    if (currentAccount && ADMIN_WALLET && currentAccount === ADMIN_WALLET) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const loadPending = async () => {
    const result = await getPendingApplications();
    if (result.success) {
      setPendingApps(result.data);
    }
  };

  useEffect(() => {
    checkAdminAccess();
    loadPending();
    
    window.ethereum?.on("accountsChanged", checkAdminAccess);
    return () => window.ethereum?.removeListener("accountsChanged", checkAdminAccess);
  }, []);

  const handleAuthorize = async (address: string = universityAddress) => {
    if (!isAdmin) return alert("Access Denied: You are not the system administrator.");
    if (!ethers.isAddress(address)) return alert("Invalid Ethereum address");
    
    setIsAuthorizing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, certificateRegistryABI, signer);

      const tx = await contract.authorizeIssuer(address);
      await tx.wait();
      
      const dbResult = await updateUniversityStatusInDb(address, "APPROVED", tx.hash);
      
      if (!dbResult.success) throw new Error(dbResult.error || "Database sync failed.");
      
      alert(`Success! ${address} is now authorized.`);
      await loadPending();
      setUniversityAddress("");
    } catch (error: any) {
      console.error("Auth Error:", error);
      alert(`Error: ${error.message || "Failed to authorize"}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-xl font-bold text-rose-600">Access Denied</h1>
        <p className="text-slate-600 mt-2">
          Ensure your <code>.env</code> file has <code>NEXT_PUBLIC_ADMIN_ADDRESS</code> set correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-[#1B2559]">System Admin Control</h1>
      
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Authorize Wallet Manually</label>
        <div className="flex gap-4">
          <input 
            className="flex-1 px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border"
            placeholder="0x..." 
            value={universityAddress}
            onChange={(e) => setUniversityAddress(e.target.value)} 
          />
          <button onClick={() => handleAuthorize()} disabled={isAuthorizing} className="bg-[#0052FF] text-white px-6 py-3 rounded-xl font-bold">
            {isAuthorizing ? "Processing..." : "Authorize"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="font-bold mb-6">Pending Applications ({pendingApps.length})</h2>
        {pendingApps.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No pending applications found.</p>
        ) : (
          <div className="space-y-6">
            {pendingApps.map((app) => (
              <div key={app.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b last:border-0">
                <div>
                  <p className="text-lg font-bold text-[#1B2559]">{app.universityName}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1 break-all">{app.walletAddress}</p>
                </div>
                
                {/* Displaying the extra details */}
                <div className="space-y-1 text-sm text-slate-600">
                  <p><span className="font-semibold">Accreditation:</span> {app.accreditationId}</p>
                  <p><span className="font-semibold">Location:</span> {app.location || "N/A"}</p>
                  <p><span className="font-semibold">Website:</span> {app.website || "N/A"}</p>
                  <p className="font-semibold">Documents:</p>
                  <div className="flex gap-2">
                    {app.documents?.map((doc: string, idx: number) => (
                      <a key={idx} href={doc} target="_blank" className="text-blue-500 underline text-xs">Doc {idx + 1}</a>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button 
                    onClick={() => handleAuthorize(app.walletAddress)}
                    disabled={isAuthorizing}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    {isAuthorizing ? "Approving..." : "Approve Application"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}