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
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col md:grid md:grid-cols-[256px,1fr]">
      
      {/* DIAGNOSTIC SIDEBAR: 
          - Added 'border-4 border-red-500' and 'bg-red-100' to force visibility.
          - If you see a red box, the layout is working.
          - If you see no red box on PC, the 'md:' breakpoint is not triggering.
      */}
      <aside className="hidden md:block h-full border-r-4 border-red-500 bg-red-100 z-50">
        <div className="text-[10px] text-red-600 font-bold p-1 uppercase">Sidebar Debug</div>
        <Sidebar universityName={universityName} /> 
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* MOBILE NAV */}
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