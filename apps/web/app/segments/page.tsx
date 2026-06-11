'use client';

import { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Users 
} from 'lucide-react';
import type { Segment, SegmentRule } from "@xeno/db";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);

  // Visual Builder Rules State
  const [rules, setRules] = useState<SegmentRule[]>([
    { field: 'total_spent', op: 'gte', value: '5000' }
  ]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Segment Save State
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Natural Language Input State
  const [nlPrompt, setNlPrompt] = useState('');
  const [isNlLoading, setIsNlLoading] = useState(false);

  const fields = [
    { value: 'total_spent', label: 'Total Spent (₹)' },
    { value: 'order_count', label: 'Order Count' },
    { value: 'city', label: 'City' },
    { value: 'last_order_days_ago', label: 'Days Since Last Order' },
    { value: 'signup_days_ago', label: 'Days Since Signup' },
    { value: 'rfm_recency', label: 'RFM Recency (1-5)' },
    { value: 'rfm_frequency', label: 'RFM Frequency (1-5)' },
    { value: 'rfm_monetary', label: 'RFM Monetary (1-5)' }
  ];

  const operators = [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' }
  ];

  const fetchSegments = async () => {
    setIsSavedLoading(true);
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      if (data.success) {
        setSegments(data.data);
      }
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const addRuleRow = () => {
    setRules([...rules, { field: 'city', op: 'eq', value: 'Mumbai' }]);
  };

  const removeRuleRow = (index: number) => {
    const newRules = rules.filter((_, idx) => idx !== index);
    setRules(newRules);
  };

  const updateRuleRow = (index: number, key: keyof SegmentRule, val: any) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      [key]: val
    } as SegmentRule;
    setRules(newRules);
  };

  const runPreview = async () => {
    setIsPreviewLoading(true);
    setPreviewCount(null);
    try {
      // Normalize values: convert numeric looking values to numbers
      const formattedRules = rules.map(r => ({
        ...r,
        value: isNaN(Number(r.value)) ? r.value : Number(r.value)
      }));

      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: formattedRules })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewCount(data.data.count);
        setPreviewCustomers(data.data.sample || []);
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const saveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName.trim() || isSaving) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const formattedRules = rules.map(r => ({
        ...r,
        value: isNaN(Number(r.value)) ? r.value : Number(r.value)
      }));

      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc,
          rules: formattedRules
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus('✅ Segment saved successfully!');
        setSegmentName('');
        setSegmentDesc('');
        setPreviewCount(null);
        setPreviewCustomers([]);
        fetchSegments();
      } else {
        setSaveStatus(`❌ Failed to save: ${data.error}`);
      }
    } catch (err) {
      setSaveStatus('❌ Error calling server.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleNLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlPrompt.trim() || isNlLoading) return;

    setIsNlLoading(true);
    try {
      const res = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlPrompt })
      });

      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
        // Auto preview
        const previewRes = await fetch('/api/segments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: data.rules })
        });
        const previewData = await previewRes.json();
        if (previewData.success) {
          setPreviewCount(previewData.data.count);
          setPreviewCustomers(previewData.data.sample || []);
        }
      }
    } catch (err) {
      console.error('NL Parse error:', err);
    } finally {
      setIsNlLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-violet-600" />
          Smart Segmentation Hub
        </h1>
        <p className="text-sm text-slate-500 font-medium">Define target shopper lists via rule builders or natural language instructions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Segment Builders */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: AI Prompt Segmenter */}
          <div className="bg-gradient-to-r from-violet-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-violet-800/40 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
              <Sparkles className="w-56 h-56" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-violet-300 animate-pulse" />
              <h2 className="text-sm font-bold tracking-wider uppercase">Build with Claude AI</h2>
            </div>
            
            <form onSubmit={handleNLSubmit} className="space-y-4 relative z-10">
              <textarea
                placeholder="Show me customers who bought twice but haven't returned in 60 days..."
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:ring-1 focus:ring-violet-400"
              />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-violet-300">
                  e.g., "shoppers in Mumbai with total_spent &gt; 5000"
                </p>
                <button
                  type="submit"
                  disabled={!nlPrompt.trim() || isNlLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-950 rounded-xl text-xs font-bold shadow hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                  {isNlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Generate Filters
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Visual Segment Builder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Visual Rules Composer</h3>
                <p className="text-xs text-slate-400">Combine custom filter metrics</p>
              </div>
              <button
                onClick={addRuleRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </button>
            </div>

            {/* Rules list */}
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/40 p-3 rounded-xl">
                  {/* Field select */}
                  <select
                    value={rule.field}
                    onChange={(e) => updateRuleRow(idx, 'field', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    {fields.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  {/* Operator select */}
                  <select
                    value={rule.op}
                    onChange={(e) => updateRuleRow(idx, 'op', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value input */}
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateRuleRow(idx, 'value', e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                  />

                  {/* Delete button */}
                  <button
                    onClick={() => removeRuleRow(idx)}
                    disabled={rules.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions & Live Count badge */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-4">
              <button
                onClick={runPreview}
                disabled={isPreviewLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPreviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Count Matching Shoppers
              </button>

              {previewCount !== null && (
                <div className="px-3.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {previewCount} matching customers
                </div>
              )}
            </div>

            {/* Matching Preview Table */}
            {previewCustomers.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Target Sample Preview:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewCustomers.map((c, idx) => (
                    <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/40 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.email}</p>
                      </div>
                      <span className="font-semibold text-slate-700">₹{Number(c.total_spent).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Save segment form */}
          {previewCount !== null && (
            <form onSubmit={saveSegment} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Save as New Segment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Segment Name (e.g. Mumbai High Spenders)"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={segmentDesc}
                  onChange={(e) => setSegmentDesc(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  {saveStatus || `Rules will apply dynamically to new checkouts.`}
                </span>
                <button
                  type="submit"
                  disabled={isSaving || !segmentName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Segment
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Col: Saved Segments List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Saved Segments</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
              {segments.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {isSavedLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
              </div>
            ) : segments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs">No segments saved yet.</p>
              </div>
            ) : (
              segments.map((seg) => (
                <div key={seg.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-3 group">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {seg.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold">
                        {seg.customer_count} shoppers
                      </span>
                    </div>
                    {seg.description && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {seg.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{seg.created_at ? new Date(seg.created_at).toLocaleDateString() : 'Active'}</span>
                    <button
                      onClick={() => {
                        setRules(seg.rules);
                        setPreviewCount(seg.customer_count);
                      }}
                      className="text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5"
                    >
                      Load Rules
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
