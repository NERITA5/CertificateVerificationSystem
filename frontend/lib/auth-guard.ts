// lib/auth-guard.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyUniversityAccess } from "@/app/actions/auth";

/**
 * Interface for the validated session data
 */
export interface AuthUser {
  wallet: string;
  user: string;
  id: string; // Added ID for better database referencing in components
}

/**
 * Protects dashboard routes by validating session cookies 
 * and verifying university status against the database.
 */
export async function protectDashboard(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  const isAuthenticated = cookieStore.get('is_authenticated')?.value;

  console.log("--- SECURITY AUDIT ---");
  console.log(`Checking session for wallet: ${wallet || "NULL"}`);

  // 1. Strict existence check: Force re-login if cookies are missing or tampered
  if (!wallet || isAuthenticated !== 'true') {
    console.warn("Access blocked: Missing or invalid session credentials.");
    redirect('/login');
  }

  try {
    // 2. Database Verification (Single Source of Truth)
    const auth = await verifyUniversityAccess(wallet);
    
    // 3. If database rejects the wallet, purge the cookies and redirect
    if (!auth.success || !auth.id) {
      console.warn(`Unauthorized access attempt blocked. Purging sessions for: ${wallet}`);
      
      cookieStore.delete('wallet_address');
      cookieStore.delete('is_authenticated');
      
      redirect('/login'); 
    }
    
    // 4. Authorized Access: Return verified user data
    console.log(`Access GRANTED to wallet: ${wallet}`);
    
    return { 
      wallet: wallet.toLowerCase(), 
      user: auth.name || "University Portal",
      id: auth.id
    };

  } catch (error) {
    console.error("Auth Guard Database Error:", error);
    // On unexpected errors, force a logout to stay safe
    redirect('/login');
  }
}