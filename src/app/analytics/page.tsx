'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Badge, Button 
} from '@/components/ui/core';
import { 
  BarChart3, TrendingUp, Sparkles, MessageSquare, 
  HelpCircle, Calendar, ShieldCheck, Mail, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';

interface CampaignStats {
  id: string;
  name: string;
  channel: string;
  sent_count: number;
  clicked_count: number;
  revenue_attributed: number;
  status: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState({
    totalCampaigns: 0,
    totalSent: 0,
    totalClicked: 0,
    ctr: 0,
    revenue: 0
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [campRes, statsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/dashboard/stats')
      ]);

      if (campRes.ok && statsRes.ok) {
        const campData = await campRes.json();
        const statsData = await statsRes.json();
        
        setCampaigns(campData);
        setChannelData(statsData.channelComparison || []);

        // Calculate aggregates from campaign list
        let sent = 0;
        let clicked = 0;
        let rev = 0;

        campData.forEach((c: CampaignStats) => {
          sent += c.sent_count;
          clicked += c.clicked_count;
          rev += c.revenue_attributed;
        });

        setAggregates({
          totalCampaigns: campData.length,
          totalSent: sent,
          totalClicked: clicked,
          ctr: sent > 0 ? (clicked / sent) * 100 : 0,
          revenue: rev
        });
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading && campaigns.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading analytics report...</div>;
  }

  // Define colors for channel chart
  const COLORS = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-heading">
            Campaigns ROI & Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Attributed sales revenue breakdown and multi-channel marketing performance reports.
          </p>
        </div>
      </div>

      {/* Aggregate stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Campaigns', val: aggregates.totalCampaigns, sub: 'WhatsApp, Email, SMS' },
          { label: 'Total Messages Sent', val: aggregates.totalSent, sub: 'Delivered to customer devices' },
          { label: 'Average Click Rate', val: `${aggregates.ctr.toFixed(1)}%`, sub: 'Calculated click-through rate' },
          { label: 'Total Generated Sales', val: formatCurrency(aggregates.revenue), sub: '7-day attribution revenue' }
        ].map((card, idx) => (
          <Card key={idx} className="hover:shadow-sm transition-all">
            <CardHeader className="pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
              <span className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 block mt-1">{card.val}</span>
            </CardHeader>
            <CardContent>
              <span className="text-[10px] text-slate-400 block">{card.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Channel Click rates Comparison */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">CTR Comparison by Channel</CardTitle>
            <CardDescription>Average link click rates across marketing communication types.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="channel" style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis unit="%" style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip 
                  formatter={(value: any) => [`${parseFloat(value).toFixed(1)}%`, 'CTR']}
                  contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="clickRate" radius={[4, 4, 0, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Dispatches Pie-breakdown card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Campaign Attribution Audit</CardTitle>
            <CardDescription>Security and attribution constraints enforced.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-xs text-slate-500">
            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Deduplication Keys</span>
                <span className="text-[10px] block mt-0.5">Every order is attributed to exactly one campaign to prevent double-counting revenue.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <Calendar className="h-5 w-5 text-violet-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">7-Day Click Attribution</span>
                <span className="text-[10px] block mt-0.5">Purchases are only credited if the customer clicked a promotional link within the preceding 168 hours.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              <TrendingUp className="h-5 w-5 text-sky-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Attribution Multiplier</span>
                <span className="text-[10px] block mt-0.5">Integrates directly with Shopify/D2C checkout feeds to isolate high-converting templates.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CAMPAIGN ROI LISTING */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-sm font-semibold">Attribution ROI Spreadsheet</CardTitle>
          <CardDescription className="text-xs">Campaigns sorted by attributed revenue generation.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {campaigns.length > 0 ? (
            <table className="w-full min-w-[700px] border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-900">
                <tr>
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3 text-center">Audience Sent</th>
                  <th className="px-6 py-3 text-center">Clicks</th>
                  <th className="px-6 py-3 text-center">CTR %</th>
                  <th className="px-6 py-3">Attributed Sales</th>
                  <th className="px-6 py-3">ROI Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {campaigns.map((camp) => {
                  const ctr = camp.sent_count > 0 
                    ? (camp.clicked_count / camp.sent_count) * 100 
                    : 0;
                  
                  // Mock estimate: assuming average campaign cost is ₹2 per WhatsApp/SMS message sent,
                  // and ₹0.2 per Email. We can calculate ROI multiplier!
                  const costPerMsg = camp.channel === 'Email' ? 0.2 : camp.channel === 'WhatsApp' ? 2.5 : 1.5;
                  const estimatedCost = Math.max(100, camp.sent_count * costPerMsg);
                  const multiplier = camp.revenue_attributed / estimatedCost;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">{camp.name}</td>
                      <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-350">{camp.channel}</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-800 dark:text-slate-200">{camp.sent_count}</td>
                      <td className="px-6 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{camp.clicked_count}</td>
                      <td className="px-6 py-3 text-center font-mono font-bold text-violet-500">{ctr.toFixed(1)}%</td>
                      <td className="px-6 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(camp.revenue_attributed)}</td>
                      <td className="px-6 py-3">
                        {camp.revenue_attributed > 0 ? (
                          <Badge variant="success" className="font-mono font-semibold text-[10px]">
                            {multiplier.toFixed(1)}x ROI
                          </Badge>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400">No campaigns launched yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
