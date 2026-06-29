import { prisma } from "@/lib/prisma";
import VerificationLogClient from "./VerificationLogClient";

export default async function AdminVerificationLogs() {
  const logs = await prisma.verificationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { certificate: true }
  });

  return (
    <div className="w-full">
      <VerificationLogClient logs={logs} />
    </div>
  );
}