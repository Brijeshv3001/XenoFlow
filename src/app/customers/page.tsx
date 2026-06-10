'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Input, Button, Select, Badge, Dialog, DialogHeader, DialogTitle, DialogDescription, useToast 
} from '@/components/ui/core';
import { Search, Upload, FileSpreadsheet, Sparkles, Filter, ArrowUpDown } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  signup_date: string;
  total_spent: number;
  order_count: number;
  tags: string; // JSON string
  rfm_score: string;
}

const SAMPLE_CSV = `name,email,phone,city,total_spent,order_count,tags
Sachin Tendulkar,sachin.t@lumedemo.com,+919900112233,Mumbai,24500,8,["VIP","loyal"]
Virat Kohli,virat.k@lumedemo.com,+919911223344,Delhi,18900,5,["VIP","loyal"]
MS Dhoni,dhoni.ms@lumedemo.com,+919922334455,Ranchi,12000,4,["loyal"]
Rahul Dravid,rahul.d@lumedemo.com,+919933445566,Bangalore,7800,2,["regular"]
Alia Bhatt,alia.b@lumedemo.com,+919944556677,Mumbai,15500,6,["VIP","loyal"]
Ranbir Kapoor,ranbir.k@lumedemo.com,+919955667788,Mumbai,9200,3,["regular"]`;

export default function CustomersPage() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalRevenue: 0, avgLifetimeValue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [tag, setTag] = useState('');
  const [rfm, setRfm] = useState('');
  
  // CSV Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (tag) params.append('tag', tag);
      if (rfm) params.append('rfm', rfm);
      
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setTotalCount(data.totalCount);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, city, tag, rfm]);

  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      addToast({ title: 'Import failed', description: 'Please paste or load CSV content first.', type: 'error' });
      return;
    }

    setImporting(true);
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        const rowObj: any = {};
        headers.forEach((header, idx) => {
          rowObj[header] = cols[idx]?.trim() || '';
        });
        parsedRows.push(rowObj);
      }

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: parsedRows })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({ 
          title: 'Import Successful', 
          description: `Ingested ${data.count} customers into Lumé CRM.`, 
          type: 'success' 
        });
        setIsImportOpen(false);
        setCsvText('');
        fetchCustomers();
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (err: any) {
      addToast({ title: 'Import Error', description: err.message, type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const getTagBadge = (tagVal: string) => {
    const variants: any = {
      VIP: 'violet',
      loyal: 'success',
      'at-risk': 'destructive',
      new: 'warning',
      regular: 'secondary',
      imported: 'outline'
    };
    return (
      <Badge key={tagVal} variant={variants[tagVal] || 'default'} className="mr-1 mt-1 text-[10px]">
        {tagVal}
      </Badge>
    );
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
            Customers List
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View, search, and segment your shoppers. Ingest list via CSV.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Shoppers</span>
          <span className="text-xl font-bold font-heading block mt-0.5 text-slate-800 dark:text-slate-100">{stats.count}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Sales</span>
          <span className="text-xl font-bold font-heading block mt-0.5 text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalRevenue)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Customer Value</span>
          <span className="text-xl font-bold font-heading block mt-0.5 text-slate-800 dark:text-slate-100">{formatCurrency(stats.avgLifetimeValue)}</span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="pl-9"
              />
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                options={[
                  { value: '', label: 'All Cities' },
                  { value: 'Mumbai', label: 'Mumbai' },
                  { value: 'Delhi', label: 'Delhi' },
                  { value: 'Bangalore', label: 'Bangalore' },
                  { value: 'Chennai', label: 'Chennai' },
                  { value: 'Hyderabad', label: 'Hyderabad' },
                  { value: 'Pune', label: 'Pune' }
                ]}
                className="w-full sm:w-[130px]"
              />
              <Select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                options={[
                  { value: '', label: 'All Tags' },
                  { value: 'VIP', label: 'VIP' },
                  { value: 'loyal', label: 'Loyal' },
                  { value: 'at-risk', label: 'At Risk' },
                  { value: 'new', label: 'New' },
                  { value: 'one-time', label: 'One Time' }
                ]}
                className="w-full sm:w-[120px]"
              />
              <Select
                value={rfm}
                onChange={(e) => setRfm(e.target.value)}
                options={[
                  { value: '', label: 'All RFM' },
                  { value: '333', label: 'VIP (333)' },
                  { value: '222', label: 'Regular (222)' },
                  { value: '111', label: 'Lapsed (111)' }
                ]}
                className="w-full sm:w-[110px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading shoppers database...</div>
          ) : customers.length > 0 ? (
            <table className="w-full min-w-[700px] border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-900">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">RFM</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {customers.map((cust) => {
                  let tagsArr = [];
                  try {
                    tagsArr = JSON.parse(cust.tags);
                  } catch (e) {
                    tagsArr = cust.tags ? [cust.tags] : [];
                  }

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{cust.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{cust.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{cust.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{cust.city}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px] tracking-tight">{cust.rfm_score}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">
                        {formatCurrency(cust.total_spent)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{cust.order_count}</td>
                      <td className="px-6 py-4 max-w-[200px] flex flex-wrap gap-0.5">
                        {tagsArr.map((t: string) => getTagBadge(t))}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(cust.signup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No Shoppers Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Try resetting search string or adjustments to filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV IMPORT DIALOG */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-violet-500" />
            Import Customers via CSV
          </DialogTitle>
          <DialogDescription>
            Import new customer profiles directly. Load a sample dataset or paste comma-separated values (CSV).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Need sample dataset format?</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs gap-1 border-violet-200 hover:bg-violet-50 text-violet-600 dark:border-violet-900 dark:hover:bg-violet-950/30"
              onClick={() => setCsvText(SAMPLE_CSV)}
            >
              <Sparkles className="h-3 w-3" /> Load Sample CSV
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paste CSV Raw Text</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,email,phone,city,total_spent,order_count,tags&#10;John Doe,john@demo.com,+919988001122,Mumbai,5000,2,[&quot;loyal&quot;]"
              rows={8}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-mono placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button variant="violet" onClick={handleCsvImport} loading={importing}>
              Import Shoppers
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
