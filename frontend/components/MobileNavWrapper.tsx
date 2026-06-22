"use client";
import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export function MobileNavWrapper({ universityName }: { universityName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="p-4 border-b bg-white flex items-center shadow-sm">
        <button onClick={() => setIsOpen(true)} className="text-2xl">☰</button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative w-64 h-full bg-[#001A41]">
            <Sidebar universityName={universityName} />
          </div>
        </div>
      )}
    </>
  );
}