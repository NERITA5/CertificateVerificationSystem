// app/(admin)/dashboard/layout.tsx
import Sidebar from '@/components/Sidebar';
import { cookies } from 'next/headers';
import { prisma as db } from '@/lib/prisma';

// Force the layout to re-run on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  
  // Initialize with fallback
  let universityName = "University Portal";

  if (wallet) {
    try {
      const record = await db.universityApplication.findFirst({
        where: { walletAddress: { equals: wallet, mode: 'insensitive' } },
        select: { universityName: true }
      });
      
      if (record?.universityName) {
        universityName = String(record.universityName);
      }
    } catch (error) {
      console.error("Layout fetch error:", error);
    }
  }

  return (
    <div className="flex">
      {/* The 'key' prop forces a complete unmount/remount of the Sidebar 
        whenever universityName changes. This prevents stale state.
      */}
      <Sidebar 
        key={universityName} 
        universityName={universityName} 
      /> 
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}