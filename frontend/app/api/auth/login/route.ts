import { NextResponse } from 'next/server';
import { verifyUniversityAccess } from "@/app/actions/auth";

export async function POST(request: Request) {
  const { address } = await request.json();

  if (!address) {
    return NextResponse.json({ success: false, message: "No address provided" }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const auth = await verifyUniversityAccess(normalizedAddress);

  if (!auth.success) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Wallet not registered or approved." }, 
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true, name: auth.name });

  // Define shared cookie options for consistency
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const, // Prevents CSRF more effectively than 'lax'
    maxAge: 60 * 60 * 24, 
    path: '/',
  };

  response.cookies.set('is_authenticated', 'true', cookieOptions);
  response.cookies.set('wallet_address', normalizedAddress, cookieOptions);

  return response;
}