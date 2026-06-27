import { Sidebar } from '@/components/Sidebar';
import { MobileNavWrapper } from '@/components/MobileNavWrapper';
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
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* DESKTOP SIDEBAR: Hidden on mobile, forced to 256px, flex-shrink-0 prevents shrinking */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 h-full">
        <Sidebar universityName={universityName} /> 
      </div>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto">
        {/* MOBILE NAV: Only renders on screens smaller than 'md' */}
        <div className="md:hidden w-full">
          <MobileNavWrapper universityName={universityName} />
        </div>
        
        <div className="w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}