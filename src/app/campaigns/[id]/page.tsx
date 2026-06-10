'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Badge, Button, useToast 
} from '@/components/ui/core';
import { 
  ArrowLeft, RefreshCw, BarChart3, AlertCircle, 
  CheckCircle, Play, Sparkles, TrendingUp, Calendar 
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  segmentName: string;
  channel: string;
  message_template: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  revenue_attributed: number;
  created_at: string;
}

interface MessageLog {
  id: string;
  customer_id: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface AuditEvent {
  id: string;
  messageId: string;
  customerName: string;
  eventType: string;
  timestamp: string;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id: campaignId } = params;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [counts, setCounts] = useState({ queued: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    else setPolling(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setMessages(data.messages);
        setEvents(data.events);
        setCounts(data.realtimeCounts);
      }
    } catch (err) {
      console.error('Failed to load campaign details:', err);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Poll campaign status every 3 seconds to watch live callbacks
    const interval = setInterval(() => {
      fetchDetails(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [campaignId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      draft: 'secondary',
      scheduled: 'warning',
      running: 'default',
      completed: 'success'
    };
    return <Badge variant={styles[status] || 'default'}>{status}</Badge>;
  };

  const getMessageStatusBadge = (status: string) => {
    const styles: any = {
      queued: 'secondary',
      sent: 'outline',
      delivered: 'default',
      opened: 'success',
      clicked: 'violet',
      failed: 'destructive'
    };
    return <Badge variant={styles[status] || 'default'} className="text-[10px]">{status}</Badge>;
  };

  if (loading && !campaign) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading campaign analytics...</div>;
  }

  if (!campaign) {
    return (
      <div className="p-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg">Campaign Not Found</h3>
        <Button onClick={() => router.push('/campaigns')}>Back to Campaigns</Button>
      </div>
    );
  }

  // Calculate percentages for funnel
  const sentCount = campaign.sent_count || 1;
  const delPct = Math.round((campaign.delivered_count / sentCount) * 100);
  const openPct = Math.round((campaign.opened_count / (campaign.delivered_count || 1)) * 100);
  const clickPct = Math.round((campaign.clicked_count / (campaign.opened_count || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Navigation Back link */}
      <div className="flex justify-between items-center select-none">
        <button 
          onClick={() => router.push('/campaigns')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
        </button>
        {polling && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-violet-500" />
            Syncing live webhooks...
          </span>
        )}
      </div>

      {/* Campaign Metadata Header Card */}
      <div className="bg-white dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">{campaign.name}</h2>
            {getStatusBadge(campaign.status)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Launched {new Date(campaign.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Segment: <strong>{campaign.segmentName}</strong></span>
            <span>Channel: <strong>{campaign.channel}</strong></span>
          </div>
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-lg text-xs italic text-slate-500 max-w-xl">
            Template: &ldquo;{campaign.message_template}&rdquo;
          </div>
        </div>

        {/* Campaign ROI badge */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-xl text-center shrink-0 min-w-[200px]">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attributed Revenue</span>
          <span className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 block mt-1">
            {formatCurrency(campaign.revenue_attributed)}
          </span>
          <span className="text-[9px] text-slate-400 mt-1 block flex items-center justify-center gap-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> 7-day click window sales
          </span>
        </div>
      </div>

      {/* REAL-TIME STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Sent', val: campaign.sent_count, style: 'bg-slate-50 border-slate-200 dark:bg-slate-900/50' },
          { label: 'Delivered', val: campaign.delivered_count, style: 'bg-slate-50 border-slate-200 dark:bg-slate-900/50' },
          { label: 'Opened', val: campaign.opened_count, style: 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10' },
          { label: 'Clicked', val: campaign.clicked_count, style: 'bg-violet-50/20 border-violet-100 dark:bg-violet-950/10' },
          { label: 'Failed', val: campaign.failed_count, style: 'bg-red-50/20 border-red-100 dark:bg-red-950/10' }
        ].map((stat, sIdx) => (
          <div key={sIdx} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${stat.style}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            <span className="text-lg font-bold font-heading text-slate-800 dark:text-slate-200 block mt-1">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* FUNNEL AND AUDIT LOGS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Campaign Funnel Visualization */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-violet-500" /> Campaign Dispatch Funnel
            </CardTitle>
            <CardDescription className="text-xs">Live-updating drop-off stages of campaign dispatches.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-2">
            {/* Funnel Stage 1: Sent */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-350">1. Dispatched Messages</span>
                <span className="text-slate-850 dark:text-slate-200">{campaign.sent_count} sent (100%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3">
                <div className="bg-slate-400 h-3 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Funnel Stage 2: Delivered */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-350">2. Delivered to Device</span>
                <span className="text-slate-850 dark:text-slate-200">
                  {campaign.delivered_count} delivered ({campaign.sent_count > 0 ? delPct : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${campaign.sent_count > 0 ? delPct : 0}%` }} 
                />
              </div>
            </div>

            {/* Funnel Stage 3: Opened */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-350">3. Opened / Read Message</span>
                <span className="text-slate-850 dark:text-slate-200">
                  {campaign.opened_count} opened ({campaign.delivered_count > 0 ? openPct : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3">
                <div 
                  className="bg-sky-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${campaign.delivered_count > 0 ? openPct : 0}%` }} 
                />
              </div>
            </div>

            {/* Funnel Stage 4: Clicked */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-350">4. Clicked Link / Call-to-Action</span>
                <span className="text-slate-850 dark:text-slate-200">
                  {campaign.clicked_count} clicked ({campaign.opened_count > 0 ? clickPct : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3">
                <div 
                  className="bg-violet-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${campaign.opened_count > 0 ? clickPct : 0}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live webhooks event timeline audit log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Chronological Audit Trail</CardTitle>
            <CardDescription className="text-xs">Audit log updates received from simulated channels.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] overflow-y-auto flex flex-col gap-3 font-sans pr-1">
            {events.length > 0 ? (
              events.map((evt) => {
                const getBadgeColor = (type: string) => {
                  if (type === 'clicked') return 'text-violet-600 dark:text-violet-400';
                  if (type === 'opened') return 'text-emerald-500';
                  if (type === 'failed') return 'text-red-500';
                  return 'text-slate-500';
                };

                return (
                  <div key={evt.id} className="text-xs border-b border-slate-50 dark:border-slate-900 pb-2 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-slate-800 dark:text-slate-300">
                      Shopper <strong>{evt.customerName}</strong> status updated to: <span className={`font-semibold ${getBadgeColor(evt.eventType)}`}>{evt.eventType}</span>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">Waiting for callback logs...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INDIVIDUAL RECIPIENT LOGS TABLE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-sm font-semibold">Recipient Audit Listing ({messages.length} Shoppers)</CardTitle>
          <CardDescription className="text-xs">Recipients mapped to this campaign and their individual delivery metrics.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {messages.length > 0 ? (
            <table className="w-full min-w-[700px] border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50/50 dark:bg-slate-900/40 font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-900">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sent Time</th>
                  <th className="px-6 py-3">Delivered Time</th>
                  <th className="px-6 py-3">Opened Time</th>
                  <th className="px-6 py-3">Clicked Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {messages.map((msg) => {
                  const formatTime = (time: string | null) => {
                    if (!time) return '—';
                    return new Date(time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  };

                  return (
                    <tr key={msg.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{msg.customer.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{msg.customer.email}</div>
                      </td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-350">{msg.customer.city}</td>
                      <td className="px-6 py-3 select-none">{getMessageStatusBadge(msg.status)}</td>
                      <td className="px-6 py-3 font-mono">{formatTime(msg.sent_at)}</td>
                      <td className="px-6 py-3 font-mono">{formatTime(msg.delivered_at)}</td>
                      <td className="px-6 py-3 font-mono">{formatTime(msg.opened_at)}</td>
                      <td className="px-6 py-3 font-mono">{formatTime(msg.clicked_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400">No recipient logs found for this campaign.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
