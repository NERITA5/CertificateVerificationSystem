"use client";

import { BarChart3, ShieldAlert, FileText, CheckCircle2, History, Download } from "lucide-react";

export default function ReportsClient({ totalIssued, totalRevoked, onChainCount, deptStats, recentCertificates }: any) {
  return (
    <div className="w-full bg-[#F4F7FE] p-4 md:p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#1B2559]">Executive Analytics</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1B2559] hover:bg-[#0D214F] text-white px-5 py-2.5 rounded-xl text-sm font-bold print:hidden transition-colors"
        >
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total"
          value={totalIssued.toString()}
          icon={<FileText className="text-blue-500" />}
        />
        <StatCard
          title="Revoked"
          value={totalRevoked.toString()}
          icon={<ShieldAlert className="text-rose-500" />}
        />
        <StatCard
          title="On-Chain"
          value={onChainCount.toString()}
          icon={<CheckCircle2 className="text-emerald-500" />}
        />
        <StatCard
          title="Pending"
          value={(totalIssued - onChainCount).toString()}
          icon={<History className="text-amber-500" />}
        />
      </div>

      {/* Department Breakdown */}
      {Object.keys(deptStats).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm mb-6">
          <h2 className="font-bold text-[#1B2559] mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#0052FF]" />
            Certificates by Department
          </h2>
          <div className="space-y-4">
            {Object.entries(deptStats).map(([dept, count]: any) => (
              <div key={dept}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-[#1B2559]">{dept || "Unspecified"}</span>
                  <span className="font-bold text-[#0052FF]">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#0052FF] h-2 rounded-full transition-all"
                    style={{ width: `${(count / totalIssued) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Certificates */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h2 className="font-bold text-[#1B2559] mb-6">Recent Certificates</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-slate-400 uppercase border-b text-[11px]">
                <th className="pb-4 font-semibold">Student Name</th>
                <th className="pb-4 font-semibold">Degree</th>
                <th className="pb-4 font-semibold">Department</th>
                <th className="pb-4 font-semibold">Status</th>
                <th className="pb-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCertificates.length > 0 ? (
                recentCertificates.map((cert: any) => (
                  <tr key={cert.id} className="border-t hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold text-[#1B2559]">{cert.studentName}</td>
                    <td className="py-4 text-slate-500">{cert.degree}</td>
                    <td className="py-4 text-slate-500">{cert.department}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        cert.isRevoked
                          ? "bg-rose-50 text-rose-600"
                          : cert.transactionHash
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {cert.isRevoked ? "REVOKED" : cert.transactionHash ? "ON-CHAIN" : "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400 text-xs">
                      {new Date(cert.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                    No certificates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-[#1B2559]">{value}</p>
      </div>
    </div>
  );
}