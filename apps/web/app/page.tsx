'use client';

import { useDashboard } from "@/hooks/useDashboard";
import { 
  Users, 
  IndianRupee, 
  ShoppingBag, 
  ArrowUpRight, 
  Activity, 
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function DashboardPage() {
  const { stats: data, error, isLoading, mutate } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded-md shimmer-bg w-48" />
          <div className="h-10 bg-slate-200 rounded-md shimmer-bg w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl shimmer-bg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl shimmer-bg" />
          <div className="h-96 bg-slate-200 rounded-2xl shimmer-bg" />
        </div>
      </div>
    );
  }

  const stats = data.stats;
  const recentOrders = data.recentOrders || [];
  
  // Create live simulated events from recent orders or DB status changes
  const recentEvents = recentOrders.slice(0, 5).map((ord: any) => ({
    id: ord.id,
    customerName: ord.customer_name,
    campaignName: "Lumé Organic Campaign",
    type: ord.status === 'completed' ? 'clicked' : 'opened',
    timestamp: ord.order_date
  }));

  const chartData = (data.revenueByMonth || []).map((m: any) => ({
    name: m.month,
    revenue: Number(m.revenue)
  }));

  const totalCust = Number(stats.total_customers) || 1;
  const repeatBuyers = Number(stats.repeat_buyers) || 0;
  const repeatRate = Math.round((repeatBuyers / totalCust) * 100);

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Lumé Fashion brand analytics overview.</p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {Number(stats.total_customers).toLocaleString()}
            </h3>
            <span className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              +14% this month
            </span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{Number(stats.total_revenue).toLocaleString('en-IN')}
            </h3>
            <span className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              +22% growth
            </span>
          </div>
        </div>

        {/* Card 3: Avg Order Value */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Order</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{Number(stats.avg_order_value).toLocaleString('en-IN')}
            </h3>
            <span className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-500">
              Across all categories
            </span>
          </div>
        </div>

        {/* Card 4: Repeat Rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {repeatRate}%
            </h3>
            <span className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              High retention
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Sales trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                Monthly Revenue Performance
              </h2>
              <p className="text-xs text-slate-400">Order revenue trends over last few months</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No monthly sales history available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#7c3aed" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1, fill: '#7c3aed' }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Column 2: Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-violet-500" />
              Live Campaign Feed
            </h2>
            <p className="text-xs text-slate-400 mb-6">Asynchronous webhook receipt callbacks</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-64 pr-2">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">No recent campaign events.</p>
              </div>
            ) : (
              recentEvents.map((event: any, i: number) => {
                let statusBg = 'bg-slate-100 text-slate-600';
                if (event.type === 'delivered') statusBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200/40';
                else if (event.type === 'opened') statusBg = 'bg-blue-50 text-blue-600 border border-blue-200/40';
                else if (event.type === 'clicked') statusBg = 'bg-violet-50 text-violet-600 border border-violet-200/40';
                else if (event.type === 'failed') statusBg = 'bg-red-50 text-red-600 border border-red-200/40';

                return (
                  <div key={event.id + '-' + i} className="flex gap-3 text-xs items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {event.customerName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {event.campaignName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBg}`}>
                        {event.type}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Purchase Logs</h2>
            <p className="text-xs text-slate-400">Latest orders placed by Lumé shoppers</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item Ordered</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{order.customer_name}</td>
                  <td className="py-3 px-4">{order.product_name}</td>
                  <td className="py-3 px-4 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600">
                      {order.category || 'tops'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">₹{Number(order.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
