'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Badge, Select, useToast 
} from '@/components/ui/core';
import { Megaphone, Plus, Mail, MessageSquare, Phone, Percent, Sparkles } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  segment_id: string;
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

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/segments')
      ]);

      if (campaignsRes.ok && segmentsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const segmentsData = await segmentsRes.json();
        setCampaigns(campaignsData);
        setSegments(segmentsData);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for real-time campaign statistics updates
    const interval = setInterval(() => {
      fetchData();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const getSegmentName = (segId: string | null) => {
    if (!segId) return 'All Customers';
    const segment = segments.find(s => s.id === segId);
    return segment ? segment.name : 'Unknown Segment';
  };

  const getChannelIcon = (channel: string) => {
    const icons: any = {
      Email: <Mail className="h-3.5 w-3.5" />,
      WhatsApp: <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />,
      SMS: <Phone className="h-3.5 w-3.5 text-blue-500" />,
      RCS: <Sparkles className="h-3.5 w-3.5 text-violet-500" />
    };
    return icons[channel] || <Megaphone className="h-3.5 w-3.5" />;
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-heading">
            Campaigns Tracker
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Design and review message dispatches. Watch receipt metrics update in real-time.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button variant="violet" className="gap-2 text-xs font-bold shadow-md shadow-violet-100">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </Link>
      </div>

      {/* Campaigns Listing Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-sm font-semibold">Active Campaigns List</CardTitle>
          <CardDescription className="text-xs">Click on any row to drill down into logs and funnel details.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && campaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Loading campaigns database...</div>
          ) : campaigns.length > 0 ? (
            <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-900">
                <tr>
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Target Segment</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Sent</th>
                  <th className="px-6 py-4 text-center">Delivery %</th>
                  <th className="px-6 py-4 text-center">Engagement</th>
                  <th className="px-6 py-4">Attributed ROI</th>
                  <th className="px-6 py-4">Launch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {campaigns.map((camp) => {
                  const deliveryPct = camp.sent_count > 0 
                    ? (camp.delivered_count / camp.sent_count) * 100 
                    : 0;
                  const openPct = camp.delivered_count > 0
                    ? (camp.opened_count / camp.delivered_count) * 100
                    : 0;
                  const clickPct = camp.opened_count > 0
                    ? (camp.clicked_count / camp.opened_count) * 100
                    : 0;

                  return (
                    <tr 
                      key={camp.id} 
                      onClick={() => router.push(`/campaigns/${camp.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 transition-colors">
                          {camp.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {getSegmentName(camp.segment_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          {getChannelIcon(camp.channel)}
                          <span>{camp.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 select-none">{getStatusBadge(camp.status)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {camp.sent_count}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-750 dark:text-slate-350">{deliveryPct.toFixed(0)}%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{camp.failed_count} fails</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[10px] text-slate-500 font-medium">
                          👁️ {openPct.toFixed(0)}% Open
                        </div>
                        <div className="text-[10px] text-violet-500 font-semibold mt-0.5">
                          🖱️ {clickPct.toFixed(0)}% Click
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(camp.revenue_attributed)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {camp.scheduled_at 
                          ? new Date(camp.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : new Date(camp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No Campaigns Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Get started by building and launching a new marketing campaign.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
