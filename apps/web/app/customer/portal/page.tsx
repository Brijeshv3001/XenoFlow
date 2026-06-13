'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  ShoppingBag, 
  Mail, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Award,
  LogOut,
  Sparkles,
  DollarSign,
  Package
} from 'lucide-react';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  order_count: number;
  avg_order_value: number;
  signup_date: string;
  city: string;
  state: string;
  tags?: string;
  orders: any[];
}

interface MessageData {
  id: string;
  campaign_id: string;
  campaign_name: string;
  subject_line: string | null;
  rendered_text: string;
  channel: string;
  status: string;
  updated_at: string;
}

export default function CustomerPortal() {
  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'messages'>('orders');
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    async function loadPortalData() {
      try {
        // 1. Get session
        const sessionRes = await fetch('/api/auth/me');
        const sessionData = await sessionRes.json();
        
        if (!sessionData.success || !sessionData.user) {
          router.push('/login');
          return;
        }
        setSession(sessionData.user);

        const custId = sessionData.user.customerId;

        // 2. Get customer details
        const custRes = await fetch(`/api/customers/${custId}`);
        const custData = await custRes.json();
        if (custData.success) {
          setCustomer(custData.data);
        }

        // 3. Get messages
        const msgRes = await fetch('/api/customers/messages');
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMessages(msgData.messages || []);
        }

      } catch (err) {
        console.error('Error loading portal data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090D1A] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide text-violet-400">Opening Lumé Client Portal...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex items-center justify-center text-slate-300">
        Customer data not found.
      </div>
    );
  }

  // Calculate Loyalty Tier
  let tierName = 'Insider (Silver Class)';
  let tierColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  let tierScore = 0; // 0 to 100
  
  if (customer.total_spent >= 15000) {
    tierName = 'Elite (Platinum Class)';
    tierColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    tierScore = 100;
  } else if (customer.total_spent >= 7500) {
    tierName = 'VIP (Gold Class)';
    tierColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    tierScore = 60;
  } else {
    tierScore = 30;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-200">
      
      {/* Top Banner Navigation */}
      <header className="sticky top-0 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800/80 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center pulse-glow">
              <Store className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-wide">Lumé Portal</span>
              <span className="ml-2.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/25">
                Client Space
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-semibold text-white">{customer.name}</span>
              <span className="block text-[10px] text-slate-500">{customer.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-rose-900/50 hover:bg-rose-950/10 text-xs font-medium text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Top: Welcome & Loyalty Status */}
        <div className="bg-gradient-to-r from-violet-950/20 via-indigo-950/10 to-slate-950 border border-slate-800/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Namaste, {customer.name}! 
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            </h2>
            <p className="text-sm text-slate-400">
              Welcome back to your Lumé luxury portal. We appreciate your partnership.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tierColor}`}>
                <Award className="w-3.5 h-3.5" />
                Lumé {tierName}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {customer.city}, {customer.state}
              </span>
            </div>
          </div>

          {/* Loyalty tier bar */}
          <div className="w-full md:w-80 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Insider Class</span>
              <span className="text-violet-400">Elite Platinum</span>
            </div>
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full transition-all duration-500" 
                style={{ width: `${tierScore}%` }}
              ></div>
            </div>
            <span className="block text-[10px] text-slate-500 text-right">
              Total Spent: {formatCurrency(customer.total_spent)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0F172A]/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{customer.order_count}</span>
            </div>
          </div>

          <div className="bg-[#0F172A]/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Total Purchases</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{formatCurrency(customer.total_spent)}</span>
            </div>
          </div>

          <div className="bg-[#0F172A]/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Order Value</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{formatCurrency(customer.avg_order_value)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-semibold text-sm transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'text-white border-violet-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            Order History ({customer.orders.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-3 font-semibold text-sm transition-all duration-200 border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'messages'
                ? 'text-white border-violet-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Mail className="w-4.5 h-4.5" />
            Lumé Inbox ({messages.length})
          </button>
        </div>

        {/* Tab Contents: Order History */}
        {activeTab === 'orders' && (
          <div className="bg-[#0F172A]/20 border border-slate-800/80 rounded-3xl overflow-hidden">
            {customer.orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <ShoppingBag className="w-12 h-12 text-slate-600" />
                <span>No order records found in your account history.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0A0E1C]/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Product Purchased</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-sm">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/30 transition-all">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{order.id}</td>
                        <td className="px-6 py-4 font-semibold text-white">{order.product_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/50">
                            {order.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.order_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white text-right">{formatCurrency(order.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Messages Inbox */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Message Feed List */}
            <div className="lg:col-span-1 space-y-3">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0F172A]/20 border border-slate-800/80 rounded-2xl flex flex-col items-center gap-3">
                  <Mail className="w-10 h-10 text-slate-600" />
                  <span>Your inbox is empty.</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  let channelBadge = 'bg-green-500/10 text-green-400 border-green-500/20';
                  if (msg.channel.toLowerCase() === 'sms') {
                    channelBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  } else if (msg.channel.toLowerCase() === 'email') {
                    channelBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  }
                  
                  return (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-950/20'
                          : 'bg-[#0F172A]/20 border-slate-800 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${channelBadge}`}>
                          {msg.channel}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.updated_at).toLocaleTimeString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {msg.subject_line || msg.campaign_name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {msg.rendered_text}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center w-full border-t border-slate-850/60 pt-2 text-[10px]">
                        <span className="text-slate-500">Campaign: {msg.campaign_name}</span>
                        <span className="text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Read <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: Message Detail Viewer */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="bg-[#0F172A]/30 border border-slate-800/80 rounded-2xl p-6 space-y-6 min-h-[400px] flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-800/85 pb-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                          Sender: Lumé Brand Promotion
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {selectedMessage.subject_line || selectedMessage.campaign_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Received: {new Date(selectedMessage.updated_at).toLocaleString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                        {selectedMessage.channel}
                      </span>
                    </div>

                    {/* Simulation Mock Interface */}
                    <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 font-sans relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 flex gap-1.5 opacity-60">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      
                      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-900/80 mb-3.5">
                        <div className="w-6.5 h-6.5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                          LM
                        </div>
                        <span className="text-xs font-semibold text-white">Lumé VIP Team</span>
                      </div>

                      {/* Content copy */}
                      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.rendered_text}
                      </p>
                    </div>
                  </div>

                  {/* Funnel Event Log */}
                  <div className="border-t border-slate-800/80 pt-4 flex flex-wrap gap-4 items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Target Gateway Handoff: Handset verified
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Status: {selectedMessage.status.toUpperCase()}
                    </span>
                  </div>

                </div>
              ) : (
                <div className="bg-[#0F172A]/10 border border-slate-800/60 border-dashed rounded-2xl p-12 text-center text-slate-500 min-h-[400px] flex flex-col justify-center items-center gap-4">
                  <Mail className="w-14 h-14 text-slate-700 animate-bounce" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400">Select a Message</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Choose any incoming letter from the left inbox view to inspect the campaign parameters and template rendering.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
