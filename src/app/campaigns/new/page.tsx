'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter,
  Input, Button, Select, Badge, useToast 
} from '@/components/ui/core';
import { Megaphone, ArrowLeft, Sparkles, AlertTriangle, Eye, Send, ArrowRight } from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  customer_count: number;
}

interface AiDraft {
  tone: string;
  subject: string | null;
  content: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState<Segment[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState<'Email' | 'WhatsApp' | 'SMS' | 'RCS'>('WhatsApp');
  const [messageTemplate, setMessageTemplate] = useState('');
  
  // AI Drafting
  const [aiGoal, setAiGoal] = useState('');
  const [aiTone, setAiTone] = useState('friendly');
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [drafting, setDrafting] = useState(false);

  // Dispatch Loading
  const [sending, setSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch('/api/segments');
        if (res.ok) {
          const data = await res.json();
          setSegments(data);
          if (data.length > 0) setSegmentId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load segments:', err);
      }
    };
    fetchSegments();
  }, []);

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setMessageTemplate(before + token + after);
    
    // Focus back and set cursor position after token
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  const handleGenerateAiDrafts = async () => {
    if (!aiGoal.trim()) return;

    setDrafting(true);
    setAiDrafts([]);
    try {
      const res = await fetch('/api/campaigns/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal, channel, tone: aiTone })
      });

      if (res.ok) {
        const data = await res.json();
        setAiDrafts(data.variants || []);
        addToast({ title: 'Drafts Created', description: 'Generated 3 AI variants with personalization tokens.', type: 'success' });
      }
    } catch (err) {
      console.error('AI drafting failed:', err);
      addToast({ title: 'AI drafting error', description: 'Failed to communicate with copywriting assistant.', type: 'error' });
    } finally {
      setDrafting(false);
    }
  };

  const handleLoadDraft = (content: string) => {
    setMessageTemplate(content);
    addToast({ title: 'Template Loaded', description: 'AI variant copy loaded directly into editor.', type: 'info' });
  };

  const handleSendCampaign = async (sendNow: boolean) => {
    if (!name.trim() || !segmentId || !messageTemplate.trim()) {
      addToast({ title: 'Validation Failed', description: 'Please fill in all campaign fields.', type: 'warning' });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          segmentId,
          channel,
          messageTemplate,
          sendNow
        })
      });

      if (res.ok) {
        const campaign = await res.json();
        addToast({ 
          title: sendNow ? 'Campaign Dispatched' : 'Campaign Saved', 
          description: sendNow ? 'Messages queued for simulation callbacks.' : 'Saved as draft.', 
          type: 'success' 
        });
        router.push(`/campaigns/${campaign.id}`);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Dispatch error');
      }
    } catch (err: any) {
      addToast({ title: 'Campaign Creation Failed', description: err.message, type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const getTargetSegmentCount = () => {
    const seg = segments.find(s => s.id === segmentId);
    return seg ? seg.customer_count : 0;
  };

  // Compile a preview text replacing placeholders with sample customer data
  const getCompiledPreview = () => {
    const sampleCustomer = {
      firstName: 'Priya',
      lastOrderDate: '2026-05-18',
      loyaltyPoints: '1240',
      productCategory: 'tops'
    };

    return messageTemplate
      .replace(/\{\{first_name\}\}/g, sampleCustomer.firstName)
      .replace(/\{\{last_order_date\}\}/g, sampleCustomer.lastOrderDate)
      .replace(/\{\{loyalty_points\}\}/g, sampleCustomer.loyaltyPoints)
      .replace(/\{\{product_category\}\}/g, sampleCustomer.productCategory);
  };

  const tokens = ['{{first_name}}', '{{last_order_date}}', '{{loyalty_points}}', '{{product_category}}'];

  return (
    <div className="space-y-6">
      {/* Back to campaigns list */}
      <button 
        onClick={() => router.push('/campaigns')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium select-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
      </button>

      {/* Progress Bar Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex gap-4 text-xs font-semibold select-none">
          <span className={step === 1 ? "text-violet-600 dark:text-violet-400" : "text-slate-400"}>1. Configure details</span>
          <span className="text-slate-300 dark:text-slate-800">/</span>
          <span className={step === 2 ? "text-violet-600 dark:text-violet-400" : "text-slate-400"}>2. Write message copy</span>
          <span className="text-slate-300 dark:text-slate-800">/</span>
          <span className={step === 3 ? "text-violet-600 dark:text-violet-400" : "text-slate-400"}>3. Preview & send</span>
        </div>
        <div className="text-xs text-slate-400 font-medium">Step {step} of 3</div>
      </div>

      {/* STEP 1: CAMPAIGN CONFIGURATION */}
      {step === 1 && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-violet-500" />
              Configure Campaign Details
            </CardTitle>
            <CardDescription className="text-xs">Provide a campaign identifier, choose the target segment, and select dispatch channel.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Campaign Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Linen Launch Coupon"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Segment</label>
              <Select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                options={segments.map(s => ({ value: s.id, label: `${s.name} (${s.customer_count} shoppers)` }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Dispatch Channel</label>
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                options={[
                  { value: 'WhatsApp', label: 'WhatsApp Messenger' },
                  { value: 'Email', label: 'Email Newsletter' },
                  { value: 'SMS', label: 'SMS Text' },
                  { value: 'RCS', label: 'RCS Business Chat' }
                ]}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              variant="violet" 
              className="text-xs font-bold gap-1 shadow-md shadow-violet-100"
              disabled={!name.trim() || !segmentId}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: WRITE MESSAGE COPY & AI DRAFTER */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          {/* Main message editor */}
          <Card className="md:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Compose Campaign Message</CardTitle>
              <CardDescription className="text-xs">Write copy. Inject personalization tags directly by clicking them.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Personalization Tokens */}
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 self-center mr-1">Insert Tokens:</span>
                {tokens.map((tok) => (
                  <button
                    key={tok}
                    onClick={() => handleInsertToken(tok)}
                    className="text-[10px] font-mono bg-white hover:bg-violet-50 hover:text-violet-600 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 p-1 px-2 rounded-md font-bold text-slate-600 dark:text-slate-350 dark:hover:text-violet-400 transition-colors"
                  >
                    {tok}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-1">
                <textarea
                  ref={textareaRef}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Hey {{first_name}}, check out our new collections! Grab it now..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" className="text-xs" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                variant="violet" 
                className="text-xs font-bold gap-1 shadow-md shadow-violet-100"
                disabled={!messageTemplate.trim()}
                onClick={() => setStep(3)}
              >
                Configure Preview <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </CardFooter>
          </Card>

          {/* AI Drafting Panel */}
          <Card className="md:col-span-2 border border-violet-100 bg-violet-50/5 dark:border-violet-900/30 dark:bg-violet-950/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4" /> AI copywriter co-pilot
              </CardTitle>
              <CardDescription className="text-xs">Describe the campaign goal, and AI will generate 3 customized variants.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400">Campaign Goal / Offer</label>
                <Input
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="e.g. Diwali discount on tops for loyal VIPs"
                  disabled={drafting}
                />
              </div>

              <Button 
                onClick={handleGenerateAiDrafts} 
                variant="violet" 
                disabled={!aiGoal.trim() || drafting}
                loading={drafting}
                className="w-full text-xs"
              >
                Draft Copies
              </Button>

              {/* AI Draft Results */}
              {aiDrafts.length > 0 && (
                <div className="flex flex-col gap-3 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Generated Variants:</span>
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {aiDrafts.map((draft, dIdx) => (
                      <div key={dIdx} className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 flex flex-col gap-2 relative">
                        <Badge variant="violet" className="absolute top-2 right-2 text-[9px] uppercase tracking-wider">{draft.tone}</Badge>
                        
                        {draft.subject && (
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-350 pr-14 leading-tight">
                            Subject: {draft.subject}
                          </div>
                        )}
                        <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                          {draft.content}
                        </pre>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="text-[10px] h-7 w-full py-0 mt-1"
                          onClick={() => handleLoadDraft(draft.content)}
                        >
                          Load into editor
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: PREVIEW & DISPATCH */}
      {step === 3 && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Eye className="h-4.5 w-4.5 text-violet-500" /> Confirm and Dispatch
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm targets and preview live-rendered token replacement on simulated devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Target recap */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 select-none">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Target segment count</span>
                <span className="text-lg font-bold text-slate-850 dark:text-slate-100">{getTargetSegmentCount()} matching shoppers</span>
              </div>
              <Badge variant="violet" className="font-semibold text-xs py-1 px-3">
                {channel} Channel
              </Badge>
            </div>

            {/* Device Simulator Visual Mockup */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Device Simulator Preview</span>
              
              {channel === 'WhatsApp' ? (
                /* WhatsApp chat bubble mockup */
                <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 font-sans text-xs flex flex-col gap-2 max-w-sm mx-auto shadow-sm">
                  <div className="flex items-center gap-2 border-b border-emerald-100/40 dark:border-emerald-900/20 pb-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">L</div>
                    <span className="font-semibold text-[10px] text-emerald-800 dark:text-emerald-400">Lumé Official</span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg rounded-tl-none border border-slate-100 dark:border-slate-850 shadow-sm max-w-[85%] text-slate-850 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {getCompiledPreview()}
                    <span className="block text-[8px] text-slate-400 text-right mt-1.5">10:43 PM ✔</span>
                  </div>
                </div>
              ) : channel === 'Email' ? (
                /* Email envelope mockup */
                <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden max-w-md mx-auto text-xs bg-white dark:bg-slate-950 shadow-sm">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-850 flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>From: news@lume.in</span>
                      <span>To: priya.sharma@lumedemo.com</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Subject: Special VIP Offer inside!</div>
                  </div>
                  <div className="p-4 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-350 min-h-[120px] text-[11px]">
                    {getCompiledPreview()}
                  </div>
                </div>
              ) : (
                /* Generic SMS / RCS bubble */
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-sans text-xs flex flex-col gap-2 max-w-sm mx-auto shadow-sm">
                  <div className="bg-violet-600 p-3 rounded-lg rounded-tr-none text-white max-w-[85%] self-end shadow-sm whitespace-pre-wrap leading-relaxed">
                    {getCompiledPreview()}
                  </div>
                </div>
              )}
            </div>

            {/* Scale warning */}
            <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-400 select-none">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>System Simulation Check:</strong> Pressing <strong>Dispatch Campaign</strong> will immediately call the separate Channel Service to initiate staggered status updates (sent, delivered, opened, clicked) and run attribution models.
              </span>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" className="text-xs" onClick={() => setStep(2)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="text-xs" onClick={() => handleSendCampaign(false)} disabled={sending}>
                Save Draft
              </Button>
              <Button 
                variant="violet" 
                className="text-xs font-bold gap-1 shadow-md shadow-violet-100" 
                onClick={() => handleSendCampaign(true)} 
                disabled={sending}
                loading={sending}
              >
                <Send className="h-3.5 w-3.5" /> Dispatch Campaign
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
