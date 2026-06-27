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
      {/* DESKTOP SIDEBAR:
        - hidden (mobile): hidden by default
        - md:flex: shows as flex on medium screens and up
        - w-64: explicit width
        - flex-shrink-0: prevents the sidebar from being crushed
        - bg-white: ensures it's visible against the page background
      */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 h-full bg-white z-10">
        <Sidebar universityName={universityName} /> 
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* MOBILE NAV: Only renders on screens smaller than 'md' */}
        <header className="md:hidden w-full flex-shrink-0">
          <MobileNavWrapper universityName={universityName} />
        </header>
        
        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}