"use client";
import { BarChart3, ShieldAlert, FileText, CheckCircle2, History, Download } from "lucide-react";


export default function ReportsClient({ totalIssued, totalRevoked, onChainCount, deptStats, recentCertificates }: any) {
  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1B2559]">Executive Analytics</h1>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#1B2559] text-white px-5 py-2.5 rounded-xl text-sm font-bold print:hidden">
            <Download size={16} /> Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total" value={totalIssued.toString()} icon={<FileText className="text-blue-500" />} />
          <StatCard title="Revoked" value={totalRevoked.toString()} icon={<ShieldAlert className="text-rose-500" />} />
          <StatCard title="On-Chain" value={onChainCount.toString()} icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard title="Pending" value={(totalIssued - onChainCount).toString()} icon={<History className="text-amber-500" />} />
        </div>

        {/* ... keep the rest of your JSX exactly as it was ... */}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-[#1B2559]">{value}</p>
      </div>
    </div>
  );
}