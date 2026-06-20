"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyUniversityAccess } from "@/app/actions/auth";

export async function getDashboardStats() {
  try {
    // 1. Get the wallet from the secure cookie
    const cookieStore = await cookies();
    const wallet = cookieStore.get('wallet_address')?.value;

    if (!wallet) throw new Error("Unauthorized: No session found");
    
    // 2. Validate and get university context (ID and Name)
    // The auth object carries the ID, so we don't need to pass it from the client
    const auth = await verifyUniversityAccess(wallet);
    if (!auth.success || !auth.id) {
      throw new Error("Unauthorized: Access denied for this wallet");
    }

    // 3. Fetch data SCOPED to this specific university ID
    const [totalIssued, revokedCount, recentCertificates] = await Promise.all([
      prisma.certificate.count({ 
        where: { universityId: auth.id } 
      }),
      prisma.certificate.count({ 
        where: { universityId: auth.id, isRevoked: true } 
      }),
      prisma.certificate.findMany({
        where: { universityId: auth.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    const validCount = totalIssued - revokedCount;

    return {
      totalIssued,
      validCount,
      revokedCount,
      recentCertificates,
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    throw new Error("Failed to load dashboard data. Please log in again.");
  }
}