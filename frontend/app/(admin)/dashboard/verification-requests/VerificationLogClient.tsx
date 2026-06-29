"use client";

import { ShieldCheck } from "lucide-react";

export default function VerificationLogClient({ logs }: { logs: any[] }) {
  return (
    <div className="w-full bg-[#F4F7FE] p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B2559]">
            Certificate Verification Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring all external certificate verification attempts.
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 flex-shrink-0">
          <ShieldCheck className="text-blue-500" size={20} />
          <span className="font-bold text-[#1B2559]">{logs.length} Total Checks</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-slate-400 uppercase border-b text-[11px]">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Certificate ID</th>
                <th className="px-6 py-4 font-semibold">Requester Info</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1B2559]">
                      {log.certificate?.studentName || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      {log.certificateId?.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {log.requesterEmail || "Public User"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">No verification attempts yet</p>
                      <p className="text-slate-300 text-xs">
                        When someone scans a certificate QR code, it will appear here.
                      </p>
                    </div>
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