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
    // Removed overflow-hidden to let the browser handle layout flow naturally
    <div className="flex h-screen w-full bg-[#F8FAFC]">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 bg-white z-20">
        <Sidebar universityName={universityName} /> 
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full min-w-0">
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