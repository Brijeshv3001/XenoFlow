'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ role: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (pathname === '/login') {
          if (data.user.role === 'admin') {
            router.push('/');
          } else {
            router.push('/customer/portal');
          }
        }
      } else {
        setUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error(err);
      if (pathname !== '/login') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090D1A] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide text-violet-400">Loading XenoFlow...</p>
        </div>
      </div>
    );
  }

  // If on login, render directly
  if (pathname === '/login') {
    return <div className="min-h-screen bg-[#090D1A]">{children}</div>;
  }

  // If customer role, render simplified layout without admin sidebar/AI assistant
  if (user?.role === 'customer') {
    return <div className="min-h-screen bg-[#090D1A] text-slate-100">{children}</div>;
  }

  // Admin layout
  return (
    <div className="flex w-full min-h-screen bg-[#0B0F19]">
      {/* Left Sidebar */}
      <Sidebar
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        isAssistantOpen={isAssistantOpen}
        adminUser={user}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#090D1A]">
        {children}
      </main>

      {/* Right AI Assistant */}
      <AIAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
