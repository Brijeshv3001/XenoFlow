'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Badge } from '@/components/ui/core';
import { 
  Users, IndianRupee, ShoppingCart, Percent, 
  ArrowUpRight, RefreshCw, Sparkles, MessageSquare 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';

interface Aggregates {
  totalCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
  repeatPurchaseRate: number;
}

interface OrderActivity {
  id: string;
  customerName: string;
  amount: number;
  productName: string;
  orderDate: string;
}

interface EventActivity {
  id: string;
  customerName: string;
  campaignName: string;
  eventType: string;
  timestamp: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
}

interface ChannelComparison {
  channel: string;
  sent: number;
  clicked: number;
  clickRate: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData[]>([]);
  const [channelComparison, setChannelComparison] = useState<ChannelComparison[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderActivity[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventActivity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setAggregates(data.aggregates);
        setMonthlyRevenue(data.monthlyRevenue);
        setChannelComparison(data.channelComparison);
        setRecentOrders(data.recentOrders);
        setRecentEvents(data.recentEvents);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Poll for real-time updates every 5 seconds (especially callbacks)
    const interval = setInterval(() => {
      fetchStats(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-white border border-slate-200 rounded-xl md:col-span-2 dark:bg-slate-950 dark:border-slate-800" />
          <div className="h-96 bg-white border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Sub-header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-heading">
            Lumé D2C Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time campaign dispatch callbacks, customer lists, and revenue attribution metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing...
            </span>
          )}
          <Badge variant="violet" className="gap-1">
            <Sparkles className="h-3 w-3" /> Live Updates On
          </Badge>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Customers */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Customers</CardTitle>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
              {aggregates?.totalCustomers}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
              <span className="text-emerald-500 font-medium inline-flex items-center">
                +12.5% <ArrowUpRight className="h-3 w-3" />
              </span> 
              growth from last month
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
              {aggregates ? formatCurrency(aggregates.totalRevenue) : '₹0'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
              <span className="text-emerald-500 font-medium inline-flex items-center">
                +8.2% <ArrowUpRight className="h-3 w-3" />
              </span> 
              attributed to campaigns
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Avg Order Value */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Order Value</CardTitle>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
              {aggregates ? formatCurrency(aggregates.avgOrderValue) : '₹0'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Basket size average per order
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Repeat Purchase Rate */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repeat Purchase Rate</CardTitle>
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
              {aggregates?.repeatPurchaseRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Percentage of multi-buyers (2+ orders)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Area Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Monthly Revenue Trend</CardTitle>
            <CardDescription>Visualizing customer sales over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                  <YAxis tickFormatter={(v) => `₹${v/1000}k`} style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No sales data found.</div>
            )}
          </CardContent>
        </Card>

        {/* Channel comparison bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Channel Engagement</CardTitle>
            <CardDescription>Campaign dispatches vs clicks</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelComparison} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="channel" style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis style={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="sent" fill="#94a3b8" name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="hsl(var(--primary))" name="Clicked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* FEEDS LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Sales Orders</CardTitle>
            <CardDescription>Latest customer purchase orders received</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((ord) => (
                <div key={ord.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block">{ord.customerName}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{ord.productName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">{formatCurrency(ord.amount)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-sm py-6">No recent orders.</div>
            )}
          </CardContent>
        </Card>

        {/* Live campaign events audit feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Live Campaign Events</CardTitle>
            <CardDescription>Real-time campaign receipt webhook logs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {recentEvents.length > 0 ? (
              recentEvents.map((evt) => {
                const getEventBadge = (type: string) => {
                  const style: any = {
                    queued: 'secondary',
                    sent: 'outline',
                    delivered: 'default',
                    opened: 'success',
                    clicked: 'violet',
                    failed: 'destructive'
                  };
                  return <Badge variant={style[type] || 'default'}>{type}</Badge>;
                };

                return (
                  <div key={evt.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 last:border-0 last:pb-0">
                    <div className="overflow-hidden pr-2">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">
                        {evt.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        {evt.campaignName}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 select-none shrink-0">
                      {getEventBadge(evt.eventType)}
                      <span className="text-[9px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-400 text-sm py-6">No recent events. Waiting for callbacks...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
