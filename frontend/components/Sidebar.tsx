"use client";

import { 
  LayoutDashboard, Award, FileText, Users, 
  ShieldAlert, BarChart3, Building2, Settings, 
  HelpCircle, LogOut, Search 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from "@/app/actions/logout";

interface SidebarProps {
  universityName?: string; 
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Award, label: 'Issue Certificate', href: '/dashboard/issue' },
  { icon: FileText, label: 'My Certificates', href: '/dashboard/my-certificates' },
  { icon: Users, label: 'Students', href: '/dashboard/students' },
  { icon: ShieldAlert, label: 'Revoked Certificates', href: '/dashboard/revoked-certificates' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Search, label: 'Verification Requests', href: '/dashboard/verification-requests' },
  { icon: Building2, label: 'Institution Profile', href: '/dashboard/profile' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/dashboard/help' },
];

// CHANGED: Using a named export 'export function' instead of 'export default'
export function Sidebar({ universityName = "University Portal" }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 bg-[#001A41] text-white/70 flex flex-col h-full z-50">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 mb-3 bg-[#0052FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 size={28} className="text-white" />
          </div>
          <h1 className="font-bold text-sm leading-tight text-white uppercase break-words px-2">
            {universityName}
          </h1>
          <p className="text-[10px] text-white/50 tracking-widest mt-1 uppercase">Certificate Portal</p>
        </div>
        
        <nav className="space-y-1 flex-grow">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/10' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium hover:text-white transition-colors w-full group"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}