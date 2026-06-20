"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { submitApplication } from "@/app/actions/university";
import { UploadButton } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core";

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    universityName: "",
    accreditationId: "",
    location: "",
    website: ""
  });
  const [walletAddress, setWalletAddress] = useState("");
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);
      } catch (err) {
        alert("Failed to connect wallet.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleSubmit = async () => {
    if (!ethers.isAddress(walletAddress)) return alert("Invalid wallet address.");
    if (documentUrls.length === 0) return alert("Please upload your accreditation documents first.");
    
    setLoading(true);
    try {
      await submitApplication({ 
        ...formData, 
        walletAddress, 
        documents: documentUrls 
      });
      alert("Application submitted successfully!");
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border-2 border-slate-900 mt-10 [shape-rendering:crispEdges]">
      <h1 className="text-2xl font-bold mb-8 text-[#1B2559]">University Onboarding</h1>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Wallet Address</label>
            <button type="button" onClick={handleConnectWallet} className="text-xs text-[#0052FF] font-bold hover:underline">
              Connect MetaMask
            </button>
          </div>
          <input className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl font-mono text-sm outline-none"
                 placeholder="0x..." value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
        </div>

        <div className="space-y-4">
          <input className="w-full p-4 border-2 border-slate-900 rounded-2xl outline-none" placeholder="University Name" 
                 onChange={(e) => setFormData({...formData, universityName: e.target.value})} />
          <input className="w-full p-4 border-2 border-slate-900 rounded-2xl outline-none" placeholder="Accreditation ID" 
                 onChange={(e) => setFormData({...formData, accreditationId: e.target.value})} />
          <input className="w-full p-4 border-2 border-slate-900 rounded-2xl outline-none" placeholder="Location" 
                 onChange={(e) => setFormData({...formData, location: e.target.value})} />
          <input className="w-full p-4 border-2 border-slate-900 rounded-2xl outline-none" placeholder="Official Website" 
                 onChange={(e) => setFormData({...formData, website: e.target.value})} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upload Accreditation Documents</label>
          <div className="border-2 border-dashed border-slate-900 rounded-2xl p-6 min-h-[140px] flex flex-col items-center justify-center bg-white">
            <UploadButton<OurFileRouter, "documentUploader">
              endpoint="documentUploader"
              content={{
                button({ isUploading }) {
                  return isUploading ? "Uploading..." : "Upload";
                }
              }}
              onUploadBegin={() => setIsUploading(true)}
              onClientUploadComplete={(res) => {
                setDocumentUrls(res.map((file) => file.url));
                setIsUploading(false);
                alert("Upload Successful!");
              }}
              onUploadError={(error: Error) => {
                setIsUploading(false);
                alert(`Error: ${error.message}`);
              }}
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading || isUploading} 
          className="w-full bg-[#1B2559] text-white p-4 rounded-2xl font-bold border-2 border-[#1B2559] hover:bg-white hover:text-[#1B2559] transition-none"
        >
          {isUploading ? "Uploading..." : loading ? "Submitting..." : "Apply for Authorization"}
        </button>
      </div>
    </div>
  );
}