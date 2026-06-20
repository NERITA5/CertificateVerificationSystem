import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Overwrite cookies with expired dates
  response.cookies.set('is_authenticated', '', { expires: new Date(0) });
  response.cookies.set('wallet_address', '', { expires: new Date(0) });
  return response;
}