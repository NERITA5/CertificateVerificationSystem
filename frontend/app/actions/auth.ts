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
 * Uses findFirst with insensitive mode to handle case-mismatches.
 */
export async function verifyUniversityAccess(walletAddress: string): Promise<AuthResponse> {
  // 1. Input Sanitization
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
    return { success: false, message: "Invalid or missing wallet address format." };
  }

  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    // 2. Database Lookup
    // Using findFirst with mode: 'insensitive' to ignore casing differences between DB and input
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

    // 3. Security Decision
    if (!university) {
      console.warn(`[AUTH] Unauthorized: ${normalizedAddress} not found in DB.`);
      return { success: false, message: "Access Denied: Wallet not registered as an institution." };
    }

    // 4. Status Validation
    if (university.status !== "APPROVED") {
      console.warn(`[AUTH] Denied: Wallet ${normalizedAddress} status is ${university.status}`);
      return { success: false, message: `Access Denied: Account status is '${university.status}'.` };
    }
    
    // 5. Authorized Success
    return { 
      success: true, 
      id: university.id, 
      name: university.universityName 
    };

  } catch (error) {
    console.error("[AUTH] Database Error:", error);
    return { success: false, message: "An internal security error occurred." };
  }
}