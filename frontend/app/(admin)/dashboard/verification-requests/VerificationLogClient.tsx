"use client";
import { ShieldCheck, Search, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function VerificationLogClient({ logs }: { logs: any[] }) {
  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2559]">Certificate Verification Logs</h1>
            <p className="text-sm text-slate-500">Monitoring all external certificate verification attempts.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <ShieldCheck className="text-blue-500" />
            <span className="font-bold text-[#1B2559]">{logs.length} Total Checks</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <table className="w-full">
            <thead className="text-left text-xs font-bold text-slate-400 uppercase">
              <tr>
                <th className="pb-6">Student Name</th>
                <th className="pb-6">Certificate ID</th>
                <th className="pb-6">Requester Info</th>
                <th className="pb-6">Timestamp</th>
                <th className="pb-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="text-sm">
                  <td className="py-5 font-bold text-[#1B2559]">{log.certificate.studentName}</td>
                  <td className="py-5 text-slate-500">{log.certificateId.substring(0, 12)}...</td>
                  <td className="py-5 text-slate-500">{log.requesterEmail || "Public User"}</td>
                  <td className="py-5 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}