'use client';

import { useState, useRef } from 'react';
import { useCustomers } from "@/hooks/useCustomers";
import { 
  Users, 
  Search, 
  Upload, 
  MapPin, 
  Tag, 
  Activity, 
  Loader2 
} from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('total_spent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook fetching data with pagination and filters
  const { data, isLoading, mutate } = useCustomers({
    page,
    search,
    city: cityFilter,
    tag: tagFilter,
    sortBy,
    sortDir
  });

  const customers = data?.customers || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / 50) || 1;

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Parsing file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportStatus('Error reading file.');
        setIsImporting(false);
        return;
      }

      try {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const parsedCustomers = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 2) continue;

          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = cols[index] || '';
          });

          parsedCustomers.push({
            name: rowData.name || rowData.Name || '',
            email: rowData.email || rowData.Email || '',
            phone: rowData.phone || rowData.Phone || '',
            city: rowData.city || rowData.City || 'Mumbai',
            state: rowData.state || rowData.State || 'Maharashtra',
            total_spent: parseFloat(rowData.total_spent || rowData.Spent || '0'),
            order_count: parseInt(rowData.order_count || rowData.Orders || '0', 10),
            tags: rowData.tags || rowData.Tags || 'new',
            signup_date: new Date().toISOString()
          });
        }

        setImportStatus(`Importing ${parsedCustomers.length} records...`);

        const response = await fetch('/api/customers/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customers: parsedCustomers })
        });

        const result = await response.json();
        if (result.success) {
          setImportStatus('✅ Import completed!');
          mutate();
        } else {
          setImportStatus(`❌ Import failed: ${result.error}`);
        }
      } catch (err) {
        setImportStatus('❌ Error parsing CSV.');
      } finally {
        setTimeout(() => {
          setIsImporting(false);
          setImportStatus(null);
        }, 3000);
      }
    };
    reader.readAsText(file);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Shopper Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium">Browse, filter, and import your Lumé customer database.</p>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {importStatus || 'One-click CSV Import'}
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* City Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-600 focus:outline-none py-1.5"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-600 focus:outline-none py-1.5"
            >
              <option value="">All Tags</option>
              <option value="vip">VIP</option>
              <option value="loyal">Loyal</option>
              <option value="at_risk">At Risk</option>
              <option value="new">New</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Querying directory...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-24 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Shoppers Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">Try clearing your filters or importing a new list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold cursor-pointer">
                  <th className="py-3.5 px-6" onClick={() => toggleSort('name')}>Customer Details {sortBy === 'name' ? (sortDir === 'desc' ? '▼' : '▲') : ''}</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Tags</th>
                  <th className="py-3.5 px-4">RFM Score</th>
                  <th className="py-3.5 px-4 text-right" onClick={() => toggleSort('order_count')}>Orders {sortBy === 'order_count' ? (sortDir === 'desc' ? '▼' : '▲') : ''}</th>
                  <th className="py-3.5 px-6 text-right" onClick={() => toggleSort('total_spent')}>Total Spent {sortBy === 'total_spent' ? (sortDir === 'desc' ? '▼' : '▲') : ''}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((cust: any) => {
                  const tagsArr = Array.isArray(cust.tags) 
                    ? cust.tags 
                    : (typeof cust.tags === 'string' ? cust.tags.split(',') : []);

                  const rec = cust.rfm_recency ?? 3;
                  const freq = cust.rfm_frequency ?? 3;
                  const mon = cust.rfm_monetary ?? 3;
                  const rfm = `R${rec}-F${freq}-M${mon}`;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{cust.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cust.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{cust.phone || '-'}</td>
                      <td className="py-4 px-4">{cust.city || '-'}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tagsArr.map((tag: string, idx: number) => {
                            const t = tag.trim().toLowerCase();
                            if (!t) return null;
                            let tagColor = 'bg-slate-100 text-slate-600';
                            if (t === 'vip') tagColor = 'bg-violet-100 text-violet-700 font-semibold';
                            else if (t === 'loyal') tagColor = 'bg-emerald-100 text-emerald-700';
                            else if (t === 'at_risk' || t === 'at-risk') tagColor = 'bg-red-100 text-red-700';
                            else if (t === 'new') tagColor = 'bg-blue-100 text-blue-700';

                            return (
                              <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${tagColor}`}>
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800">
                          {rfm}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-800">{cust.order_count}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                        ₹{Number(cust.total_spent).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
