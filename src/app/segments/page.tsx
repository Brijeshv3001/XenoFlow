'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Input, Button, Select, Badge, useToast 
} from '@/components/ui/core';
import { 
  Network, Plus, Trash2, Sparkles, Eye, Save, 
  HelpCircle, UserCheck, RefreshCcw 
} from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  description: string;
  rules_json: string;
  customer_count: number;
}

interface VisualRule {
  field: 'total_spent' | 'order_count' | 'city' | 'tags' | 'last_purchase_days' | 'signup_days';
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'contains' | 'lte';
  value: string;
}

const FIELD_OPTIONS = [
  { value: 'total_spent', label: 'Total Spent (₹)' },
  { value: 'order_count', label: 'Order Count' },
  { value: 'city', label: 'City' },
  { value: 'tags', label: 'Tag' },
  { value: 'last_purchase_days', label: 'Days Since Last Order' },
  { value: 'signup_days', label: 'Days Since Signup' }
];

const OPERATOR_OPTIONS = {
  total_spent: [{ value: 'gt', label: 'Greater Than (>)' }, { value: 'lt', label: 'Less Than (<)' }, { value: 'eq', label: 'Equal To (=)' }],
  order_count: [{ value: 'gt', label: 'Greater Than (>)' }, { value: 'lt', label: 'Less Than (<)' }, { value: 'eq', label: 'Equal To (=)' }],
  city: [{ value: 'eq', label: 'Is' }, { value: 'neq', label: 'Is Not' }],
  tags: [{ value: 'contains', label: 'Contains' }],
  last_purchase_days: [{ value: 'gt', label: 'More Than (>)' }, { value: 'lt', label: 'Less Than (<)' }],
  signup_days: [{ value: 'lte', label: 'Less Than / Equals (<=)' }, { value: 'gt', label: 'More Than (>)' }]
};

export default function SegmentsPage() {
  const { addToast } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Segment creation form
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [rules, setRules] = useState<VisualRule[]>([
    { field: 'total_spent', operator: 'gt', value: '5000' }
  ]);

  // Preview matching shoppers
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Natural Language Input
  const [nlPrompt, setNlPrompt] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/segments');
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleAddFieldRule = () => {
    setRules([...rules, { field: 'total_spent', operator: 'gt', value: '1000' }]);
  };

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleRuleChange = (idx: number, key: keyof VisualRule, value: string) => {
    const newRules = [...rules];
    newRules[idx] = { ...newRules[idx], [key]: value };
    
    // Set default operator if field changes
    if (key === 'field') {
      const f = value as keyof typeof OPERATOR_OPTIONS;
      newRules[idx].operator = OPERATOR_OPTIONS[f][0].value as any;
    }
    
    setRules(newRules);
  };

  // Run visual segment query to evaluate count
  const handleEvaluateSegment = async () => {
    setPreviewLoading(true);
    setPreviewCount(null);
    try {
      // We can use the NL segment endpoint by mapping visual rules to a POST,
      // or we can test rule evaluation by posting it to a quick endpoint.
      // Since NL segmentation endpoint returns customers + count from rules,
      // let's write a route or simply evaluate rules via a quick fetch.
      // We will POST the rules to /api/segments/natural-language but with pre-extracted rules!
      // Wait, we can write a simple endpoint or use the segments route?
      // Since segments POST saves, we can add a preview endpoint or just do a POST check.
      // Actually, we can POST rules to `/api/segments/natural-language` with a parameter to bypass Claude
      // and evaluate rules directly! This is very clever. Let's make it hit natural-language endpoint with `{ rules }`.
      
      const res = await fetch('/api/segments/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'DIRECT_EVALUATION', rules })
      });

      // Oh wait, our natural-language endpoint expects `{ prompt }`. Let's support `{ prompt, rules }` in `/api/segments/natural-language`
      // so if rules are provided directly, it bypasses Claude and runs query immediately! This is incredibly clean!
      // Let's check: in our `/api/segments/natural-language/route.ts` we wrote:
      // `const { prompt } = await req.json();`
      // Let's modify it to accept `{ rules }` directly as well, or we can update it now.
      // Wait! Let's update `/api/segments/natural-language/route.ts` to accept `{ prompt, rules }` and bypass Claude if rules is provided.
      // Let's see: if we modify `/api/segments/natural-language/route.ts` it's super easy!
      // We will make a quick edit there to support direct rule evaluation. Let's look at the implementation we wrote earlier.
      // It has:
      // `const { prompt } = await req.json();`
      // If we replace it with `const { prompt, rules: directRules } = await req.json();`
      // and if `directRules` is present, bypass Claude.
      // Let's do that!
      
      const evalPayload = { prompt: '', rules };
      const response = await fetch('/api/segments/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.count);
        setPreviewCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      addToast({ title: 'Query Error', description: 'Failed to run rules query.', type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save the segment in database
  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      addToast({ title: 'Failed to save', description: 'Please enter a name for the segment.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc,
          rules
        })
      });

      if (res.ok) {
        addToast({ title: 'Segment Saved', description: `Segment "${segmentName}" created successfully!`, type: 'success' });
        setSegmentName('');
        setSegmentDesc('');
        fetchSegments();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save segment');
      }
    } catch (err: any) {
      addToast({ title: 'Error saving segment', description: err.message, type: 'error' });
    }
  };

  // Run Natural Language AI segmentation
  const handleAiSegment = async () => {
    if (!nlPrompt.trim()) return;

    setNlLoading(true);
    try {
      const res = await fetch('/api/segments/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlPrompt })
      });

      if (res.ok) {
        const data = await res.json();
        addToast({ title: 'AI Query Completed', description: `Loaded ${data.count} shoppers into builder.`, type: 'success' });
        
        // Load rules into visual query builder
        setRules(data.rules || []);
        setPreviewCount(data.count);
        setPreviewCustomers(data.customers || []);
      } else {
        const data = await res.json();
        throw new Error(data.message || 'AI parsing error');
      }
    } catch (err: any) {
      addToast({ title: 'AI Segmentation Failed', description: err.message, type: 'error' });
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-heading">
            Smart Customer Segmentation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create rule-based segments or use Natural Language instructions to query customer segments.
          </p>
        </div>
      </div>

      {/* Pre-built Segments List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse dark:bg-slate-950 dark:border-slate-800" />
          ))
        ) : segments.length > 0 ? (
          segments.map((seg) => {
            let rulesArr = [];
            try {
              rulesArr = JSON.parse(seg.rules_json);
            } catch (e) {
              rulesArr = [];
            }

            return (
              <Card key={seg.id} className="hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-violet-600" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 transition-colors">
                      {seg.name}
                    </CardTitle>
                    <Badge variant="violet" className="font-semibold text-xs select-none">
                      {seg.customer_count} shoppers
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">{seg.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-[10px] text-slate-400 font-mono">
                  <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-900 pt-3">
                    {rulesArr.map((r: any, rIdx: number) => (
                      <div key={rIdx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 px-2 rounded">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{r.field}</span>
                        <span className="text-slate-400">{r.operator}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-350">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-3 text-center text-slate-400 py-8">No segments configured. Build one below!</div>
        )}
      </div>

      {/* SEGMENT CREATOR PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Visual Builder & AI Input */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* AI Segment Creator */}
          <Card className="border border-violet-100 bg-violet-50/10 dark:border-violet-900/40 dark:bg-violet-950/5 relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4" /> Create Segment with AI
              </CardTitle>
              <CardDescription className="text-xs">
                Type marketing instructions in plain English, and Xeno AI will translate them into visual query builder rules instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={nlPrompt}
                  onChange={(e) => setNlPrompt(e.target.value)}
                  placeholder="e.g. show me customers who spent more than ₹5000 and live in Mumbai"
                  disabled={nlLoading}
                  className="bg-white dark:bg-slate-900"
                />
                <Button 
                  onClick={handleAiSegment} 
                  variant="violet" 
                  disabled={!nlPrompt.trim() || nlLoading}
                  loading={nlLoading}
                  className="shrink-0 text-xs"
                >
                  Create with AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visual Rule Builder */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Network className="h-4 w-4 text-violet-500" />
                Visual Query Builder
              </CardTitle>
              <CardDescription className="text-xs">
                Define explicit filter rules and constraints to isolate customer profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              {/* Rules List */}
              <div className="flex flex-col gap-3">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Select
                      value={rule.field}
                      onChange={(e) => handleRuleChange(idx, 'field', e.target.value as any)}
                      options={FIELD_OPTIONS}
                      className="flex-1"
                    />
                    
                    <Select
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(idx, 'operator', e.target.value as any)}
                      options={OPERATOR_OPTIONS[rule.field]}
                      className="w-full sm:w-[150px]"
                    />

                    <Input
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-full sm:w-[150px] bg-white dark:bg-slate-950"
                    />

                    {rules.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(idx)} className="text-red-500 hover:text-red-600 select-none shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleAddFieldRule}>
                  <Plus className="h-4 w-4" /> Add Rule Condition
                </Button>
                
                <Button variant="secondary" size="sm" className="text-xs gap-1.5" onClick={handleEvaluateSegment} loading={previewLoading}>
                  <Eye className="h-4 w-4" /> Run segment query
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Saving panel */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Save className="h-4 w-4 text-violet-500" /> Save Segment
              </CardTitle>
              <CardDescription className="text-xs">Save the active rules query to retarget customers in campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Segment Name</label>
                <Input
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g. VIP Mumbai Shoppers"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  value={segmentDesc}
                  onChange={(e) => setSegmentDesc(e.target.value)}
                  placeholder="Who are these shoppers?"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              {previewCount !== null && (
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center flex items-center justify-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Shopper Matches</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{previewCount} matches</span>
                  </div>
                </div>
              )}

              <Button variant="violet" className="w-full text-xs font-bold" onClick={handleSaveSegment}>
                Save Segment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Query Result Preview list */}
      {previewCount !== null && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
            <CardTitle className="text-sm font-bold">Matching Segment Preview ({previewCount} Customers)</CardTitle>
            <CardDescription className="text-xs">Sample profile rows matching current query rules.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {previewCustomers.length > 0 ? (
              <table className="w-full min-w-[600px] text-left text-xs text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50/50 dark:bg-slate-900/40 font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-900">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">RFM</th>
                    <th className="px-6 py-3">Spent</th>
                    <th className="px-6 py-3">Orders</th>
                    <th className="px-6 py-3">Last Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {previewCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {cust.name}
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{cust.email}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-350">{cust.city}</td>
                      <td className="px-6 py-3 font-mono">{cust.rfm_score}</td>
                      <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-250">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cust.total_spent)}
                      </td>
                      <td className="px-6 py-3 font-semibold">{cust.order_count}</td>
                      <td className="px-6 py-3 text-slate-400">
                        {cust.last_order_date 
                          ? new Date(cust.last_order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400">No shoppers match these rules. Try broadening conditions.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
