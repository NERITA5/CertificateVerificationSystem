import React from 'react';
import { downloadCertificatePdf } from "@/app/utils/download";
import { Download } from "lucide-react";
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { getAllCertificates } from "@/app/actions/certificates";
import CertificatesRegistryView from "@/components/CertificatesRegistryView";

// Force Next.js to always bypass static cache files and query PostgreSQL dynamically on page load
export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  // Fetch data cleanly on the server container
  const certificates = await getAllCertificates();

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
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