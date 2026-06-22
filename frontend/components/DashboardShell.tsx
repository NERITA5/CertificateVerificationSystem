"use client";
import { useState } from "react";
import { Sidebar } from '@/components/Sidebar'; // Import directly

export default function DashboardShell({ 
  children, 
  universityName 
}: { 
  children: React.ReactNode; 
  universityName: string; // Pass the data, not the component
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* MOBILE DRAWER */}
      <div className={`fixed inset-0 z-50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className={`absolute left-0 top-0 h-full w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar universityName={universityName} />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block w-64 h-full flex-shrink-0">
        <Sidebar universityName={universityName} />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="md:hidden p-4 border-b bg-white flex items-center">
          <button onClick={() => setIsOpen(true)} className="p-2 text-2xl">☰</button>
        </div>
        <div className="p-4 md:p-8 w-full">{children}</div>
      </main>
    </div>
  );
}