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
    // We use grid for desktop (md:) to force the sidebar to exist.
    // h-screen ensures it takes the full viewport height.
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col md:grid md:grid-cols-[256px,1fr]">
      
      {/* DESKTOP SIDEBAR:
          - hidden: hidden on mobile
          - md:block: shown as a block on desktop
          - h-full: fills the vertical grid track
      */}
      <aside className="hidden md:block h-full border-r border-slate-200 bg-white z-10">
        <Sidebar universityName={universityName} /> 
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* MOBILE NAV: Only renders on screens smaller than 'md' */}
        <header className="md:hidden w-full flex-shrink-0">
          <MobileNavWrapper universityName={universityName} />
        </header>
        
        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}