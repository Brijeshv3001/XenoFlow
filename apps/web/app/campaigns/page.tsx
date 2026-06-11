'use client';

import { useState, useEffect } from 'react';
import { useCampaignStats } from "@/hooks/useCampaignStats";
import { 
  Megaphone, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Loader2, 
  CheckCircle,
  Copy,
  Info,
  Send,
  Eye,
  Check,
  MousePointerClick,
  IndianRupee
} from 'lucide-react';
import type { Segment } from "@xeno/db";

interface Variant {
  variant: number;
  tone: string;
  subject: string;
  message: string;
}

export default function CampaignsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  // Form states
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'sms' | 'rcs'>('whatsapp');
  const [subjectLine, setSubjectLine] = useState('Exclusive Lumé Offer');
  
  // Message composition
  const [messageTemplate, setMessageTemplate] = useState('');
  
  // AI message generation
  const [campaignGoal, setCampaignGoal] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiVariants, setAiVariants] = useState<Variant[]>([]);

  // Sending status
  const [isSending, setIsSending] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Live funnel stats polling
  const { data: liveStats } = useCampaignStats(activeCampaignId || "");

  const fetchSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      if (data.success) {
        setSegments(data.data);
        if (data.data.length > 0) {
          setSelectedSegmentId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleInsertToken = (token: string) => {
    setMessageTemplate(prev => prev + ` {{${token}}}`);
  };

  const handleGenerateAiVariants = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!campaignGoal.trim() || isAiGenerating) return;

    setIsAiGenerating(true);
    setAiVariants([]);
    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: campaignGoal,
          channel: selectedChannel,
          tone: 'friendly'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiVariants(data.variants);
      }
    } catch (err) {
      console.error('Failed to generate AI variants:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSendCampaign = async (sendNow: boolean) => {
    setIsSending(true);
    try {
      // 1. Save campaign draft
      const draftRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName || `${selectedChannel} Promo Campaign`,
          segment_id: selectedSegmentId,
          channel: selectedChannel,
          message_template: messageTemplate,
          subject_line: selectedChannel === 'email' ? subjectLine : undefined
        })
      });

      const draftData = await draftRes.json();
      if (!draftData.success) {
        throw new Error(draftData.error);
      }

      const campaignId = draftData.data.id;
      setActiveCampaignId(campaignId);

      // 2. Dispatch campaign if requested
      if (sendNow) {
        const sendRes = await fetch(`/api/campaigns/${campaignId}/send`, {
          method: 'POST'
        });
        const sendData = await sendRes.json();
        if (!sendData.ok) {
          throw new Error(sendData.error);
        }
      }

      setCurrentStep(4);
    } catch (err) {
      console.error('Failed to dispatch campaign:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Preview helper substituting template tags
  const renderPreview = () => {
    return messageTemplate
      .replace(/\{\{first_name\}\}/g, 'Aarav')
      .replace(/\{\{last_order_date\}\}/g, '25 Oct 2025')
      .replace(/\{\{total_spent\}\}/g, '₹4,500')
      .replace(/\{\{city\}\}/g, 'Mumbai');
  };

  const currentSegment = segments.find(s => s.id === selectedSegmentId);

  return (
    <div className="flex-1 p-8 space-y-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Wizard Progress bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-violet-600" />
            Campaign Composer
          </h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Horizontal steps bar */}
        <div className="flex items-center gap-2">
          {[
            { step: 1, name: 'Setup' },
            { step: 2, name: 'Draft' },
            { step: 3, name: 'Preview' },
            { step: 4, name: 'Dispatch & Track' }
          ].map((item) => (
            <div key={item.step} className="flex-1 flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                currentStep >= item.step ? 'bg-violet-600' : 'bg-slate-200'
              }`} />
              <span className={`text-[10px] font-bold ${
                currentStep >= item.step ? 'text-violet-600' : 'text-slate-400'
              }`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Campaign details setup */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Step 1: Campaign Configuration</h3>
          
          <div className="space-y-4">
            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g., Diwali Silk Kurta Winback"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Segment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Audience Segment</label>
                {isLoadingSegments ? (
                  <div className="h-10 bg-slate-50 rounded-xl shimmer-bg" />
                ) : (
                  <select
                    value={selectedSegmentId}
                    onChange={(e) => setSelectedSegmentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.customer_count} members)</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Delivery Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Messaging Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="sms">Short Message Service (SMS)</option>
                  <option value="email">Email Campaign</option>
                  <option value="rcs">Rich Communication Services (RCS)</option>
                </select>
              </div>
            </div>

            {selectedChannel === 'email' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g., Treat yourself to premium Lumé dresses"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!campaignName.trim() || !selectedSegmentId}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
            >
              Compose Message
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Message template writing */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Visual drafting box */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Step 2: Message Template</h3>
              
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                {selectedChannel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                {selectedChannel}
              </span>
            </div>

            {/* Personalized token buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Insert Personalization Tokens
              </span>
              <div className="flex flex-wrap gap-2">
                {['first_name', 'last_order_date', 'total_spent', 'city'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleInsertToken(t)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-mono font-semibold transition-colors"
                  >
                    {"{{" + t + "}}"}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Box */}
            <textarea
              placeholder="Hi {{first_name}}! Since your last order on {{last_order_date}}, we added new kurtas..."
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 placeholder-slate-400"
            />

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!messageTemplate.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
              >
                Preview Message
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Helper Sidebar */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white space-y-4 h-fit">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Copywriter</h3>
            </div>
            
            <textarea
              placeholder="Draft a friendly win-back message offering free shipping to at-risk buyers..."
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:bg-white/10"
            />
            
            <button
              onClick={handleGenerateAiVariants}
              disabled={!campaignGoal.trim() || isAiGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Draft Message
            </button>

            {aiVariants.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/10 max-h-[300px] overflow-y-auto pr-1">
                {aiVariants.map((v, idx) => (
                  <div key={idx} className="p-3 border border-white/10 rounded-xl bg-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-violet-300 uppercase">{v.tone}</span>
                      <button
                        onClick={() => setMessageTemplate(v.message)}
                        className="text-[10px] font-semibold text-white hover:text-violet-300 flex items-center gap-0.5"
                      >
                        <Copy className="w-3 h-3" /> Use Draft
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 italic">"{v.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Step 3: Message preview rendered in phone container */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Step 3: Personalization Preview</h3>
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-4">
            {/* Phone container */}
            <div className="w-72 h-[450px] border-[6px] border-slate-900 rounded-[32px] overflow-hidden bg-slate-950 flex flex-col shadow-2xl relative">
              {/* Speaker notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-900 rounded-full z-20" />
              
              {/* Internal phone layout */}
              <div className="flex-1 bg-slate-900 flex flex-col p-4 pt-8 text-white select-none">
                {/* Header mock */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center font-bold text-[9px]">L</div>
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-100">Lumé Support</h5>
                    <p className="text-[8px] text-slate-400 font-mono">{selectedChannel.toUpperCase()}</p>
                  </div>
                </div>

                {/* Msg bubbles wrapper */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-[10px] leading-relaxed bg-slate-800 border border-slate-700/50 text-slate-200 whitespace-pre-wrap">
                    {renderPreview()}
                  </div>
                </div>

                {/* Bottom send mock bar */}
                <div className="h-8 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">Type a message...</span>
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <Smartphone className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign info block */}
            <div className="flex-1 space-y-4">
              <div className="p-4 border border-violet-100 bg-violet-50/50 rounded-xl text-xs text-violet-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4.5 h-4.5" />
                  Token Mapping Verification
                </div>
                <p className="text-[11px] leading-relaxed">
                  We mapped placeholder keys for sample recipient <strong>"Aarav"</strong>. Values resolve as follows:
                </p>
                <ul className="list-disc list-inside text-[11px] font-mono mt-1 space-y-1">
                  <li>{"{{first_name}}"} → Aarav</li>
                  <li>{"{{last_order_date}}"} → 25 Oct 2025</li>
                  <li>{"{{total_spent}}"} → ₹4,500</li>
                  <li>{"{{city}}"} → Mumbai</li>
                </ul>
              </div>

              <div className="p-4 border border-slate-100 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Target Audience Count:</h4>
                <p className="text-slate-600">
                  This campaign will target segment <strong>"{currentSegment?.name || 'Segment'}"</strong> comprising <strong>{currentSegment?.customer_count ?? 0}</strong> shoppers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleSendCampaign(false)}
                disabled={isSending}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSendCampaign(true)}
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow transition-transform active:scale-95"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Send Campaign Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Live Funnel Tracker Panel */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campaign Delivery Funnel</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {activeCampaignId}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
              liveStats?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600 animate-pulse'
            }`}>
              {liveStats?.status || 'Draft'}
            </span>
          </div>

          {/* Delivery rates funnel bars */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sent */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <Send className="w-5 h-5 text-slate-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sent</p>
              <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{liveStats?.sent_count || 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">out of {liveStats?.total_recipients || 0}</p>
            </div>

            {/* Delivered */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <Check className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Delivered</p>
              <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">{liveStats?.delivered_count || 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {liveStats?.sent_count ? Math.round((Number(liveStats.delivered_count) / Number(liveStats.sent_count)) * 100) : 0}% delivery rate
              </p>
            </div>

            {/* Opened */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <Eye className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Opened</p>
              <h4 className="text-2xl font-extrabold text-blue-600 mt-1">{liveStats?.opened_count || 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {liveStats?.delivered_count ? Math.round((Number(liveStats.opened_count) / Number(liveStats.delivered_count)) * 100) : 0}% open rate
              </p>
            </div>

            {/* Clicked */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <MousePointerClick className="w-5 h-5 text-violet-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Clicked</p>
              <h4 className="text-2xl font-extrabold text-violet-600 mt-1">{liveStats?.clicked_count || 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {liveStats?.opened_count ? Math.round((Number(liveStats.clicked_count) / Number(liveStats.opened_count)) * 100) : 0}% click rate
              </p>
            </div>
          </div>

          {/* Revenue Attribution banner */}
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Attributed Sales Revenue</h4>
                <p className="text-[10px] text-slate-500">Orders placed within 7 days of campaign clicks</p>
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700">
              ₹{Number(liveStats?.revenue_attributed || 0).toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setCampaignName('');
                setMessageTemplate('');
                setCampaignGoal('');
                setAiVariants([]);
                setCurrentStep(1);
                setActiveCampaignId(null);
              }}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
            >
              Compose Another Campaign
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
