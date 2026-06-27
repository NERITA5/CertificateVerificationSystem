"use client";
import { useState } from "react";
import { Sidebar } from '@/components/Sidebar';

export default function DashboardShell({ 
  children, 
  universityName 
}: { 
  children: React.ReactNode; 
  universityName: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      
      {/* MOBILE DRAWER: Only visible when 'isOpen' is true */}
      <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-64 bg-[#001A41] shadow-xl">
          <Sidebar universityName={universityName} />
        </div>
      </div>

      {/* DESKTOP SIDEBAR: Hidden on mobile (md:hidden), visible on desktop (md:block) */}
      <div className="hidden md:block w-64 h-full flex-shrink-0 bg-[#001A41]">
        <Sidebar universityName={universityName} />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden p-4 bg-white border-b flex items-center">
          <button onClick={() => setIsOpen(true)} className="text-2xl p-2">☰</button>
          <span className="ml-4 font-bold text-gray-800">Menu</span>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}