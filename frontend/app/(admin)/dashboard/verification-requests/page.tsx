import { prisma } from "@/lib/prisma";
import VerificationLogClient from "./VerificationLogClient";

export default async function AdminVerificationLogs() {
  // Fetching all verification logs for the institution
  const logs = await prisma.verificationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { certificate: true }
  });

  return <VerificationLogClient logs={logs} />;
}