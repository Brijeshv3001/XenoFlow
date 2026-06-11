'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  BarChart3,
  Megaphone, 
  CheckCircle, 
  Activity, 
  Search, 
  Layers, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';

interface CampaignStats {
  id: string;
  name: string;
  channel: string;
  status: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  revenueAttributed: number;
  createdAt: string;
}

interface MessageLog {
  id: string;
  campaignName: string;
  customerName: string;
  phone: string;
  status: string;
  updatedAt: string;
}

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        setMessageLogs(data.messageLogs);
        setFunnelData(data.funnelData);
        setChannelData(data.channelData);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Poll updates every 5 seconds
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#7c3aed', '#6366f1', '#3b82f6', '#10b981'];

  const filteredLogs = messageLogs.filter(log => 
    log.customerName.toLowerCase().includes(searchFilter.toLowerCase()) || 
    log.campaignName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    log.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex-1 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Compiling marketing insights...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-600" />
          Campaign Analytics & Attribution
        </h1>
        <p className="text-sm text-slate-500 font-medium">Verify multi-channel marketing campaigns, click funnels, and 7-day attribute sales.</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Funnel Chart Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mb-6">Aggregated flow rate across all promotional campaigns</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(val) => [Number(val).toLocaleString(), 'Count']}
                  contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Revenue Comparison Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Channel Contribution</h3>
            <p className="text-xs text-slate-400 mb-6">Sales attributed to clicks within 7 days by channel</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelData}
                margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="channel" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Attributed Revenue']}
                  contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Historical Campaigns</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Sent</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-right">Opened</th>
                <th className="py-3 px-4 text-right">Clicked</th>
                <th className="py-3 px-4 text-right">Sales Attributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {campaigns.map((camp) => {
                let statusColor = 'bg-slate-100 text-slate-600';
                if (camp.status === 'completed') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                else if (camp.status === 'running') statusColor = 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse';
                else if (camp.status === 'draft') statusColor = 'bg-amber-50 text-amber-600 border border-amber-100';

                return (
                  <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{camp.name}</td>
                    <td className="py-3 px-4 font-medium text-slate-500">{camp.channel}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColor}`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{camp.sentCount}</td>
                    <td className="py-3 px-4 text-right">{camp.deliveredCount}</td>
                    <td className="py-3 px-4 text-right">{camp.openedCount}</td>
                    <td className="py-3 px-4 text-right">{camp.clickedCount}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{camp.revenueAttributed.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Delivery Logs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery Audit Logs</h3>
            <p className="text-xs text-slate-400">Message-by-message real-time trace details</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by customer, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold sticky top-0 bg-white z-10">
                <th className="py-3 px-4">Message ID</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Trace Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => {
                let badge = 'bg-slate-100 text-slate-600';
                if (log.status === 'delivered') badge = 'bg-emerald-50 text-emerald-600';
                else if (log.status === 'opened') badge = 'bg-blue-50 text-blue-600';
                else if (log.status === 'clicked') badge = 'bg-violet-50 text-violet-600';
                else if (log.status === 'failed') badge = 'bg-red-50 text-red-600';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-400">{log.id}</td>
                    <td className="py-2.5 px-4">{log.campaignName}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{log.customerName}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${badge}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(log.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
