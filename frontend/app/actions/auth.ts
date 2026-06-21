"use server";

import { prisma } from "@/lib/prisma";

// Define a strict return type for better development experience
export type AuthResponse = {
  success: boolean;
  message?: string;
  id?: string;
  name?: string;
};

/**
 * Verifies university access based on blockchain wallet address.
 * Uses strict unique lookup and status-based authorization.
 */
export async function verifyUniversityAccess(walletAddress: string): Promise<AuthResponse> {
  // 1. Input Sanitization
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
    return { success: false, message: "Invalid or missing wallet address format." };
  }

  // Normalize to lowercase to ensure database consistency
  const normalizedAddress = walletAddress.toLowerCase().trim();

  try {
    // 2. Database Lookup (findUnique is safer for @unique fields)
    const university = await prisma.universityApplication.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
      select: {
        id: true,
        status: true,
        universityName: true,
      }
    });

    // 3. Security Decision: Fail Closed
    if (!university) {
      console.warn(`[AUTH] Unauthorized access attempt from unknown wallet: ${normalizedAddress}`);
      return { success: false, message: "Access Denied: Wallet not registered as an institution." };
    }

    // 4. Status Validation
    if (university.status !== "APPROVED") {
      console.warn(`[AUTH] Denied access attempt: Wallet ${normalizedAddress} has status: ${university.status}`);
      return { success: false, message: `Access Denied: Account status is '${university.status}'.` };
    }
    
    // 5. Authorized Success
    return { 
      success: true, 
      id: university.id, 
      name: university.universityName 
    };

  } catch (error) {
    // 6. Error Handling
    console.error("[AUTH] Database Error:", error);
    return { success: false, message: "An internal security error occurred." };
  }
}