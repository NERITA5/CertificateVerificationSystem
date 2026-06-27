"use server";

import { prisma } from "@/lib/prisma";

export type AuthResponse = {
  success: boolean;
  message?: string;
  id?: string;
  name?: string;
};

/**
 * Verifies university access based on blockchain wallet address.
 */
export async function verifyUniversityAccess(walletAddress: string): Promise<AuthResponse> {
  console.log("[AUTH] Starting verification for:", walletAddress);

  // 1. Input Sanitization
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
    console.warn("[AUTH] Invalid input format.");
    return { success: false, message: "Invalid or missing wallet address format." };
  }

  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    // 2. Database Lookup
    console.log("[AUTH] Querying database for:", normalizedAddress);
    
    const university = await prisma.universityApplication.findFirst({
      where: {
        walletAddress: {
          equals: normalizedAddress,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        status: true,
        universityName: true,
      }
    });

    console.log("[AUTH] Query completed. Result found:", !!university);

    // 3. Security Decision
    if (!university) {
      console.warn(`[AUTH] Unauthorized: ${normalizedAddress} not found in DB.`);
      return { success: false, message: "Access Denied: Wallet not registered." };
    }

    // 4. Status Validation
    if (university.status !== "APPROVED") {
      console.warn(`[AUTH] Denied: Wallet ${normalizedAddress} status is ${university.status}`);
      return { success: false, message: `Access Denied: Account status is '${university.status}'.` };
    }
    
    // 5. Authorized Success
    console.log("[AUTH] Success for:", university.universityName);
    return { 
      success: true, 
      id: university.id, 
      name: university.universityName 
    };

  } catch (error) {
    console.error("[AUTH] Database Error details:", error);
    return { success: false, message: "Connection to database failed. Please check your network." };
  }
}