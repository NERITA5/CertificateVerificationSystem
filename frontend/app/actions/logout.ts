"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  
  // 1. Delete the authentication cookies
  cookieStore.delete('wallet_address');
  cookieStore.delete('is_authenticated');

  // 2. Redirect to the login page
  redirect('/login');
}