"use client";

import React from "react";
import Link from "next/link";

import { RevokeButton } from "@/components/RevokeButton";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  BarChart3,
  HelpCircle,
  Bell,
  Menu,
  FileText,
  Building2,
  ShieldX,
} from "lucide-react";

export default function DashboardClient({ 
  stats, 
  universityName 
}: { 
  stats: {
    totalIssued: number;
    validCount: number;
    revokedCount: number;
    recentCertificates: any[];
  }, 
  universityName: string 
}) {
  
  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center font-bold text-[#1B2559]">
        Loading Secure Dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      

      <main className="flex-1 ml-64 p-8">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-600 lg:hidden" />
            <h2 className="text-lg font-bold text-[#1B2559]">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative p-2 text-slate-400">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#0052FF] rounded-full border-2 border-white"></span>
            </div>

            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-slate-200">
              <div className="w-8 h-8 bg-[#001A41] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                <Building2 size={14} />
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-bold text-[#1B2559]">{universityName}</p>
                <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2559]">Welcome back, Administrator!</h1>
            <p className="text-slate-500 text-sm">Monitoring your decentralized certificate verification system.</p>
          </div>

          <Link
            href="/dashboard/issue"
            className="bg-[#0052FF] hover:bg-[#0041CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold"
          >
            <Plus size={18} /> Issue New Certificate
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Certificates Issued", val: stats.totalIssued, icon: FileText, color: "text-[#0052FF]", bg: "bg-blue-50" },
            { label: "Valid Certificates", val: stats.validCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Revoked Certificates", val: stats.revokedCount, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center text-center">
              <div className={`${s.bg} ${s.color} p-3 rounded-full mb-3`}>
                <s.icon size={24} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">{s.label}</p>
              <h3 className="text-3xl font-bold text-[#1B2559]">{s.val?.toLocaleString() || 0}</h3>
              <Link href="/dashboard/my-certificates" className="text-xs text-[#0052FF] font-bold mt-2">View all →</Link>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-bold mb-6">Recent Certificates</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-slate-400 uppercase border-b">
                      <th className="pb-4">Student Name</th>
                      <th className="pb-4">Degree</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCertificates?.length > 0 ? (
                      stats.recentCertificates.map((cert: any) => (
                        <tr key={cert.id} className="border-t">
                          <td className="py-4 font-bold">{cert.studentName}</td>
                          <td className="py-4 text-slate-500">{cert.degree}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${cert.isRevoked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                              {cert.isRevoked ? "REVOKED" : "VALID"}
                            </span>
                          </td>
                          <td className="py-4 flex justify-center gap-4 text-slate-400">
                            <button title="Download Certificate"><Download size={18} /></button>
                            {!cert.isRevoked ? (
                              <RevokeButton ipfsHash={cert.ipfsHash} />
                            ) : (
                              <span className="text-slate-300 cursor-not-allowed"><ShieldX size={18} /></span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="py-10 text-center text-slate-400 italic">No certificates issued yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold mb-6">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { t: "Issue New Certificate", i: Plus, link: "/dashboard/issue" },
                  { t: "Revoke Certificate", i: AlertCircle, link: "/dashboard/my-certificates" },
                  { t: "Generate Report", i: BarChart3, link: "/dashboard/reports" },
                ].map((a, i) => (
                  <Link key={i} href={a.link} className="flex items-center gap-4 p-3.5 border rounded-xl hover:bg-slate-50 transition-colors">
                    <a.i size={20} className="text-[#0052FF]" />
                    <p className="font-bold text-[#1B2559]">{a.t}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border text-center">
              <h3 className="font-bold mb-3 text-sm">Need Help?</h3>
              <p className="text-[11px] text-slate-500 mb-6">Check documentation or contact support.</p>
              <button className="w-full py-3 border border-[#0052FF] rounded-xl text-xs font-bold text-[#0052FF] flex items-center justify-center gap-2">
                <HelpCircle size={16} /> Visit Help Center
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}