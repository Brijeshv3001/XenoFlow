'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Loader2, 
  Search, 
  Save, 
  BarChart, 
  SendIcon, 
  Copy 
} from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  arguments: any;
  result?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi, I'm Xeno AI. How can I help you build campaigns or segment shoppers for Lumé today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleToolExpand = (toolId: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message
    const updatedHistory = [...messages, { role: 'user', content: userText } as Message];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply || "I completed that task.",
            toolCalls: data.toolCalls || []
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I hit an error: ${data.error || 'Unknown error'}`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't reach the AI server. Make sure the backend is running."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolCallCard = (tool: ToolCall, idx: number) => {
    const toolId = tool.id || `${tool.name}-${idx}`;
    const isExpanded = !!expandedTools[toolId];
    const args = tool.arguments || {};
    const result = tool.result;

    let icon = <Search className="w-4 h-4 text-violet-400" />;
    let summaryText = 'Action taken';

    if (tool.name === 'query_customers') {
      icon = <Search className="w-4 h-4 text-emerald-400" />;
      summaryText = `Queried customers → Found ${result?.count ?? 0} matches`;
    } else if (tool.name === 'create_segment') {
      icon = <Save className="w-4 h-4 text-blue-400" />;
      summaryText = `Saved Segment: "${args.name}"`;
    } else if (tool.name === 'get_campaign_stats') {
      icon = <BarChart className="w-4 h-4 text-amber-400" />;
      summaryText = `Fetched Campaign Metrics`;
    } else if (tool.name === 'create_campaign') {
      icon = <SendIcon className="w-4 h-4 text-indigo-400" />;
      summaryText = `Launched Campaign: "${args.name}"`;
    } else if (tool.name === 'generate_message_variants') {
      icon = <Copy className="w-4 h-4 text-purple-400" />;
      summaryText = `Generated Message Variants`;
    }

    return (
      <div key={toolId} className="w-full my-2 border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900/60 shadow-inner">
        <button
          onClick={() => toggleToolExpand(toolId)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-800">{icon}</div>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
              {summaryText}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/40 space-y-2.5 pt-2.5">
            <div>
              <span className="text-slate-300 font-bold block mb-0.5">Parameters:</span>
              <pre className="p-1.5 rounded bg-slate-900/90 overflow-x-auto max-w-full text-violet-300">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
            {result && (
              <div>
                <span className="text-slate-300 font-bold block mb-0.5">Outputs:</span>
                <pre className="p-1.5 rounded bg-slate-900/90 overflow-x-auto max-w-full text-emerald-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-[#0F172A] border-l border-slate-800 flex flex-col h-screen sticky top-0 text-slate-100 shadow-2xl z-40">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center pulse-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Xeno Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
            {/* Message Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-900/20'
                  : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>

            {/* Tool Calls if any */}
            {msg.toolCalls && msg.toolCalls.map((t, tIdx) => renderToolCallCard(t, tIdx))}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            </div>
            <div className="flex flex-col gap-1 w-full max-w-[70%]">
              <div className="h-4 bg-slate-800 rounded-md shimmer-bg w-full" />
              <div className="h-4 bg-slate-800 rounded-md shimmer-bg w-3/4" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="relative">
          <input
            type="text"
            placeholder="Ask AI to query, segment, or draft..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white disabled:opacity-50 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2.5 top-2.5 p-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:hover:bg-violet-600"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Claude Sonnet is integrated. Always review campaigns before sending.
        </p>
      </form>
    </div>
  );
}
