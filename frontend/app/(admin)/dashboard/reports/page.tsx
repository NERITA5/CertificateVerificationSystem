import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const allCertificates = await prisma.certificate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const totalIssued = allCertificates.length;
  const totalRevoked = allCertificates.filter((c) => c.isRevoked).length;
  const onChainCount = allCertificates.filter((c) => c.transactionHash).length;

  const deptStats = allCertificates.reduce((acc: any, cert) => {
    acc[cert.department] = (acc[cert.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="w-full">
      <ReportsClient
        totalIssued={totalIssued}
        totalRevoked={totalRevoked}
        onChainCount={onChainCount}
        deptStats={deptStats}
        recentCertificates={allCertificates.slice(0, 5)}
      />
    </div>
  );
}