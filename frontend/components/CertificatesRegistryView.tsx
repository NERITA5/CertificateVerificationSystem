"use client";
import { RevokeButton } from "./RevokeButton";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, Eye, Download, 
  MoreVertical, ExternalLink, ShieldCheck, 
  GraduationCap
} from 'lucide-react';
import { downloadCertificatePdf } from "../app/utils/download";
// 1. Import the new server action
import { deletePendingCertificate } from "@/app/actions/certificates";

interface Certificate {
  id: string;
  studentName: string;
  matricule: string;
  degree: string;
  department: string;
  transactionHash: string | null;
  certHash: string;
  ipfsHash: string;
  isRevoked?: boolean;
}

export default function CertificatesRegistryView({ 
  initialCertificates, 
  title = "Issued Certificates" 
}: { 
  initialCertificates: Certificate[], 
  title?: string 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredCertificates = initialCertificates.filter((cert) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      cert.studentName.toLowerCase().includes(query) ||
      cert.matricule.toLowerCase().includes(query) ||
      cert.degree.toLowerCase().includes(query) ||
      cert.department.toLowerCase().includes(query)
    );
  });

  // 2. Define the deletion handler
  const handleDelete = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this pending request? This cannot be undone.")) return;
    
    const result = await deletePendingCertificate(certId);
    if (!result.success) {
      alert(result.error || "Failed to delete.");
    } else {
      setActiveMenuId(null);
    }
  };

  const toggleDropdownMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  React.useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2559]">{title}</h1>
          <p className="text-slate-500 text-sm">Manage and verify academic records stored on the Ethereum Sepolia network.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matricule or name..." 
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 w-64 text-sm transition-all bg-white text-[#1B2559] font-medium"
            />
          </div>
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Student & Matricule</th>
                <th className="px-6 py-5">Department & Degree</th>
                <th className="px-6 py-5">Blockchain TX</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1B2559] group-hover:text-[#0052FF] transition-colors">{cert.studentName}</span>
                        <span className="text-[11px] text-slate-400 font-bold font-mono tracking-tight uppercase">MAT: {cert.matricule}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                          <GraduationCap size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] text-slate-700 font-bold">{cert.degree}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{cert.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {cert.transactionHash ? (
                        <div className="flex flex-col gap-1">
                          <span className="w-fit px-3 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase">On-Chain</span>
                          <Link href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`} target="_blank" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#0052FF] transition-colors">
                            <ExternalLink size={10} />
                            <span className="font-mono truncate w-24 italic">{cert.transactionHash}</span>
                          </Link>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100 uppercase">Pending Sync</span>
                      )}
                    </td>
                    <td className="px-6 py-5 relative">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/verify?hash=${cert.certHash}`} target="_blank" className="p-2 text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 rounded-xl transition-all"><Eye size={18} /></Link>
                        <button onClick={() => downloadCertificatePdf(cert.ipfsHash, cert.studentName)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Download size={18} /></button>
                        
                        {!cert.isRevoked && (
                          <div className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><RevokeButton ipfsHash={cert.ipfsHash} /></div>
                        )}

                        <div className="relative inline-block text-left">
                          <button onClick={(e) => toggleDropdownMenu(cert.id, e)} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><MoreVertical size={18} /></button>
                          {activeMenuId === cert.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 text-left">
                              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/verify?hash=${cert.certHash}`); alert("Copied!"); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium">Copy Verification Link</button>
                              {/* 3. Robust condition: check for null, undefined, or empty string */}
                              {(!cert.transactionHash || cert.transactionHash === "") && (
                                <button onClick={() => handleDelete(cert.id)} className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-bold border-t border-slate-50">Delete Pending Request</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="p-5 bg-slate-50 rounded-full text-slate-200 border border-slate-100 shadow-inner"><ShieldCheck size={48} /></div>
                        <p className="text-[#1B2559] font-bold">No Records Match Query</p>
                        <Link href="/dashboard/issue" className="mt-2 bg-[#0052FF] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-[#0041CC] transition-all">Issue New Certificate</Link>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Total Records: {filteredCertificates.length}</p>
        </div>
      </div>
    </>
  );
}