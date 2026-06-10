'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/core';
import { AIAssistant } from '@/components/AIAssistant';
import { 
  LayoutDashboard, Users, Network, Megaphone, 
  BarChart3, Sparkles, LogOut, Sun, Moon, Sparkle 
} from 'lucide-react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is preferred or set
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Segments', href: '/segments', icon: Network },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        
        {/* LEFT SIDEBAR (DEEP NAVY) */}
        <aside className="w-64 bg-slate-950 text-slate-100 flex flex-col shrink-0 border-r border-slate-900 z-30">
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-900">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-700/30">
              <Sparkle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white font-heading text-lg">Lumé</span>
              <span className="text-xs block text-slate-500 -mt-0.5">XenoCRM Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Check if path is active. Handle exact root vs subpages
              const isActive = item.href === '/' 
                ? pathname === '/' 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-700/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user profile card */}
          <div className="p-4 border-t border-slate-900 flex flex-col gap-3">
            <button
              onClick={() => setAiOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 px-4 text-xs font-semibold shadow-lg shadow-violet-500/10 transition-all active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask Xeno Co-Pilot
            </button>
            
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-900/50">
              <div className="h-8 w-8 rounded-full bg-violet-950 text-violet-400 border border-violet-900 flex items-center justify-center font-bold text-xs">
                LM
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-slate-200 block truncate">Lumé Fashion</span>
                <span className="text-[10px] text-slate-500 block truncate">sriram@lumedemo.com</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* TOP HEADER */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 dark:bg-slate-950 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-heading">
                {pathname === '/' ? 'Dashboard Overview' : menuItems.find(m => pathname.startsWith(m.href))?.name || 'CRM Manager'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Dark mode button */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Float AI Co-Pilot trigger */}
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  aiOpen 
                    ? 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/40 dark:border-violet-900 dark:text-violet-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
                AI Assistant
              </button>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        {/* AI Assistant Sidebar Drawer */}
        <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      </div>
    </ToastProvider>
  );
}
