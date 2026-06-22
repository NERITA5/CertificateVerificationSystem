// lib/auth-guard.ts
import { cookies } from "next/headers";
import { verifyUniversityAccess } from "@/app/actions/auth";

export interface AuthUser {
  wallet: string;
  user: string;
  id: string;
}

/**
 * Validates the session. Returns null if invalid so the calling 
 * component can handle the redirect safely.
 */
export async function protectDashboard(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  const isAuthenticated = cookieStore.get('is_authenticated')?.value;

  if (!wallet || isAuthenticated !== 'true') {
    return null;
  }

  try {
    const auth = await verifyUniversityAccess(wallet);
    
    // If the database check fails, return null
    if (!auth.success || !auth.id) {
      return null;
    }
    
    return { 
      wallet: wallet.toLowerCase(), 
      user: auth.name || "University Portal",
      id: auth.id
    };

  } catch (error) {
    console.error("Auth Guard Database Error:", error);
    return null;
  }
}