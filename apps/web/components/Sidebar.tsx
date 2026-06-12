'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Megaphone, 
  BarChart3, 
  Sparkles, 
  Store
} from 'lucide-react';

interface SidebarProps {
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
}

export default function Sidebar({ onToggleAssistant, isAssistantOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Segments', href: '/segments', icon: Target },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center pulse-glow">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">XenoFlow</h1>
          <p className="text-xs text-violet-400 font-medium">Lumé Fashion Brand</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-400'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onToggleAssistant}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isAssistantOpen
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'bg-slate-800 hover:bg-slate-700 text-violet-400 hover:text-white border border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900/40">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-sm">
            LM
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">Lumé Marketer</h4>
            <p className="text-[10px] text-slate-500 truncate">admin@lume.in</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
