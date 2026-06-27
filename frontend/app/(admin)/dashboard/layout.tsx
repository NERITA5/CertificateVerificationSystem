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
    // We force a flex layout here to override any global grid conflicts
    <div className="h-screen w-full flex overflow-hidden bg-[#F8FAFC]">
      
      {/* SIDEBAR:
        We use 'flex-shrink-0' to keep its size, 
        and 'hidden md:flex' to show only on desktop.
      */}
      <aside className="hidden md:flex w-64 h-full flex-shrink-0 border-r border-slate-200 bg-white">
        <Sidebar universityName={universityName} /> 
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* MOBILE NAV: visible only on small screens */}
        <header className="md:hidden w-full flex-shrink-0">
          <MobileNavWrapper universityName={universityName} />
        </header>
        
        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}