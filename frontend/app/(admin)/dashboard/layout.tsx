// app/(admin)/dashboard/layout.tsx
import { Sidebar } from '@/components/Sidebar';
import { cookies } from 'next/headers';
import { prisma as db } from '@/lib/prisma';
import { cache } from 'react';

const getUniversityName = cache(async (wallet: string) => {
  return await db.universityApplication.findFirst({
    where: { walletAddress: { equals: wallet, mode: 'insensitive' } },
    select: { universityName: true }
  });
});

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  
  let universityName = "University Portal";

  if (wallet) {
    try {
      const record = await getUniversityName(wallet);
      if (record?.universityName) {
        universityName = record.universityName;
      }
    } catch (error) {
      console.error("Layout fetch error:", error);
    }
  }

  return (
    // 'h-screen' sets height to 100vh. 'w-screen' ensures it stays within viewport.
    // 'overflow-hidden' on the parent stops ANY scrollbars from appearing here.
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <Sidebar universityName={universityName} /> 
      </div>
      
      {/* 'flex-1' makes it fill available space.
        'overflow-y-auto' allows internal vertical scrolling.
        'min-w-0' is the trick: it prevents flex-child from growing wider than its content.
      */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}