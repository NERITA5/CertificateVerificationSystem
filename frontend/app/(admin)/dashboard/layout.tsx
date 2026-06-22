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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <div className="w-64 flex-shrink-0 border-r border-slate-200">
        <Sidebar universityName={universityName} /> 
      </div>
      
      {/* 1. 'pl-0' removes the gap between sidebar and main content.
        2. 'pr-6' and 'py-6' maintain spacing on the right and top.
      */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-0">
        {/* Removed 'mx-auto' so content starts from the left edge */}
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}