import CertificatesRegistryView from "@/components/CertificatesRegistryView";
import { ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma"; 

export default async function RevokedCertificatesPage() {
  // 1. Fetch certificates and use 'as any' or explicit mapping to handle types
  const allCertificates = await prisma.certificate.findMany();
  
  // 2. Filter and map to ensure the component receives exactly what it expects
  const revokedOnly = allCertificates
    .filter((c) => c.isRevoked)
    .map((c) => ({
      ...c,
      // Force ipfsHash to be a string to satisfy your component's TypeScript interface
      ipfsHash: c.ipfsHash || "", 
      transactionHash: c.transactionHash || "",
    }));

  return (
    // REMOVED: flex min-h-screen (Layout wrapper handles full height)
    <div className="w-full">
      
      {/* REMOVED: ml-64 (Layout parent provides this space) 
          REMOVED: flex-1 (No longer needed on the main tag)
      */}
      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B2559] flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={28} />
            Revoked Certificates
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            A registry of all academic records that have been officially revoked.
          </p>
        </div>

        <CertificatesRegistryView 
          initialCertificates={revokedOnly} 
          title="Revoked Certificates" 
        />
      </main>
    </div>
  );
}