'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, User, ShieldAlert, Sparkles, LogIn } from 'lucide-react';

const SEED_CUSTOMERS = [
  { name: 'Sriram Iyer (VIP - 5 Orders)', email: 'sriram.iyer@gmail.com' },
  { name: 'Priya Sharma (VIP - 3 Orders)', email: 'priya.sharma@yahoo.com' },
  { name: 'Aisha Khan (VIP - 6 Orders)', email: 'aisha.khan@outlook.com' },
  { name: 'Kavya Reddy (VIP - 7 Orders)', email: 'kavya.reddy@gmail.com' },
  { name: 'Rohan Das (1 Order)', email: 'rohan.das@gmail.com' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'customer'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = activeTab === 'admin' 
      ? { role: 'admin', email, password }
      : { role: 'customer', email };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (activeTab === 'admin') {
          router.push('/');
        } else {
          router.push('/customer/portal');
        }
      } else {
        setError(data.error || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (custEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer', email: custEmail }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/customer/portal');
      } else {
        setError(data.error || 'Failed to login as customer.');
      }
    } catch (err) {
      setError('Network error during quick login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090D1A] overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-900/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-900/20 blur-[100px] animate-pulse delay-700"></div>

      <div className="w-full max-w-5xl bg-[#0F172A]/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-violet-950/20 flex flex-col md:flex-row min-h-[600px] z-10">
        
        {/* Left Side: Lumé Branding */}
        <div className="md:w-1/2 bg-gradient-to-br from-violet-900/50 via-indigo-950/40 to-slate-950 flex flex-col justify-between p-8 border-b md:border-b-0 md:border-r border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center pulse-glow">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-wider">XenoFlow</span>
              <span className="block text-[10px] text-violet-400 font-semibold tracking-widest uppercase">Lumé Brand Edition</span>
            </div>
          </div>

          <div className="my-8 md:my-0 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI-Native Retail Experience
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Unlock the Pulse of Your Shoppers
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated natural-language customer segmentation, dynamic copy generation with Claude, and async messaging feedback. All unified in a modern, developer-first CRM ecosystem.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex justify-between border-t border-slate-800/60 pt-4">
            <span>Powered by Anthropic Claude</span>
            <span>v1.1.0</span>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center bg-[#0F172A]/20">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-slate-400">Select your workspace role and enter credentials.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-[#0A0E1C] p-1.5 rounded-xl border border-slate-800/80 mb-6">
            <button
              onClick={() => {
                setActiveTab('admin');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Portal
            </button>
            <button
              onClick={() => {
                setActiveTab('customer');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'customer'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Customer Portal
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'admin' ? 'admin@lume.in' : 'name@example.com'}
                className="w-full px-4 py-3 rounded-xl bg-[#090D1A]/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 placeholder-slate-600"
              />
            </div>

            {activeTab === 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#090D1A]/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200 placeholder-slate-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-900/20"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Connect (For Customer Tab Only) */}
          {activeTab === 'customer' && (
            <div className="mt-6 border-t border-slate-800/80 pt-6">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Quick-Select Registered Shoppers
              </span>
              <div className="space-y-2">
                {SEED_CUSTOMERS.map((cust) => (
                  <button
                    key={cust.email}
                    onClick={() => handleQuickLogin(cust.email)}
                    disabled={loading}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-[#090D1A]/40 border border-slate-800/80 hover:border-violet-500 text-xs text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-between group cursor-pointer"
                  >
                    <span>{cust.name}</span>
                    <span className="text-[10px] text-violet-400 group-hover:translate-x-0.5 transition-transform duration-200">
                      Login &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Fill Hints (For Admin Tab Only) */}
          {activeTab === 'admin' && (
            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 flex items-start gap-3">
              <div className="text-[10px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-violet-400 block mb-0.5">Demo Credentials:</span>
                Email: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">admin@lume.in</code><br />
                Password: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">admin123</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
