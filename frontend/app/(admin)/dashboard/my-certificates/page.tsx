import React from 'react';
import { Download } from "lucide-react";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllCertificates } from "@/app/actions/certificates";
import CertificatesRegistryView from "@/components/CertificatesRegistryView";

// Force Next.js to always bypass static cache files and query PostgreSQL dynamically on page load
export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  // Fetch data cleanly on the server container
  const certificates = await getAllCertificates();

  return (
    // REMOVED: flex min-h-screen (Layout wrapper should handle full height)
    <div className="w-full">
      
      {/* REMOVED: ml-64 (The layout parent already provides this space) 
          REMOVED: flex-1 (No longer needed on the main tag directly)
      */}
      <main className="p-8">
        {/* Breadcrumbs Section */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-slate-400 hover:text-[#0052FF] flex items-center gap-1 transition-colors font-medium">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#1B2559] font-bold">Registry</span>
        </div>

        {/* Client Interactive Dynamic View Port */}
        <CertificatesRegistryView initialCertificates={certificates} />
      </main>
    </div>
  );
}