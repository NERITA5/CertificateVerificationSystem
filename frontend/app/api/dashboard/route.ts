import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUniversityAccess } from "@/app/actions/auth";

export async function GET() {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;

  console.log("--- PROXY SECURITY AUDIT ---");
  console.log("Proxy checking wallet:", wallet || "NULL");

  // 1. Block access if no session exists
  if (!wallet) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate against the database (Single Source of Truth)
  const auth = await verifyUniversityAccess(wallet);
  
  if (!auth.success) {
    console.log("Proxy DENIED access to:", wallet);
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 3. Grant access
  console.log("Proxy GRANTED access to:", wallet);
  return NextResponse.json({ success: true, user: auth.name });
}