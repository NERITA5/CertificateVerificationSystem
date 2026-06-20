"use client";
import { Search, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function VerificationClient({ initialRequests }: { initialRequests: any[] }) {
  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-[#1B2559] mb-6">Verification Requests</h1>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-8 py-4">Requester</th>
                <th className="px-8 py-4">Certificate ID</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initialRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold text-[#1B2559]">{req.requesterEmail || "Anonymous"}</td>
                  <td className="px-8 py-4 text-sm text-slate-600">{req.certificateId}</td>
                  <td className="px-8 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString()}
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    SUCCESS: "bg-emerald-50 text-emerald-600",
    PENDING: "bg-amber-50 text-amber-600",
    FAILED: "bg-rose-50 text-rose-600"
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${styles[status as keyof typeof styles] || styles.PENDING}`}>
      {status}
    </span>
  );
}