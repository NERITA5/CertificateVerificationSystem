import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address');

  // If they have a session, let them go to the dashboard.
  // If they don't, send them to the login page.
  if (wallet) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}