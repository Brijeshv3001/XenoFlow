'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, cn } from '@/components/ui/core';
import { 
  Sparkles, Send, X, Bot, User, ChevronDown, ChevronUp, 
  Search, PlusCircle, BarChart3, Mail, MessageSquare, ClipboardCheck 
} from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  input: any;
  output?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

const SUGGESTIONS = [
  "Who are my top VIP customers?",
  "Which campaign performed best last quarter?",
  "Draft a win-back email campaign for at-risk segments",
  "How many customers are in Mumbai?"
];

export function AIAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am **Xeno AI**, your marketing co-pilot. I can query customers, save segments, draft campaigns, and check campaign statistics directly. Try asking me a question or clicking one of the suggestions below.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message.content,
          toolCalls: data.toolCalls
        }
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error. Please ensure your \`ANTHROPIC_API_KEY\` environment variable is configured or try again. (${error.message})`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300 ease-in-out dark:bg-slate-950 dark:border-slate-800",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-sm">
              Xeno AI Co-Pilot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Claude Sonnet</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start')}>
            {/* Avatar */}
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
              msg.role === 'user' 
                ? "bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" 
                : "bg-violet-50 border-violet-100 text-violet-600 dark:bg-violet-950/50 dark:border-violet-900 dark:text-violet-400"
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className="flex flex-col gap-2">
              {/* Tool use rendering */}
              {msg.toolCalls && msg.toolCalls.map((tool, tIdx) => (
                <ToolActionCard key={tIdx} tool={tool} />
              ))}

              <div className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === 'user'
                  ? "bg-violet-600 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-850"
              )}>
                {/* Parse Markdown-like bold formatting */}
                <p className="whitespace-pre-line">
                  {msg.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-violet-50 border border-violet-100 text-violet-600 dark:bg-violet-950/50 dark:border-violet-900 dark:text-violet-400 shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950">
        {/* Suggestion Chips */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-col gap-2 mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggested Questions</span>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleSend(sug)}
                  className="text-left text-xs bg-white hover:bg-violet-50 hover:text-violet-600 border border-slate-200 dark:border-slate-850 dark:bg-slate-900 rounded-lg p-2 transition-all font-medium text-slate-600 dark:text-slate-300 dark:hover:text-violet-400"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or AI action..."
            disabled={loading}
            className="bg-white dark:bg-slate-900"
          />
          <Button type="submit" variant="violet" size="icon" disabled={!input.trim() || loading} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// Collapsible Action Card for Tool execution
function ToolActionCard({ tool }: { tool: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false);

  const icons: any = {
    query_customers: <Search className="h-4 w-4 text-sky-500" />,
    create_segment: <PlusCircle className="h-4 w-4 text-emerald-500" />,
    get_campaign_stats: <BarChart3 className="h-4 w-4 text-violet-500" />,
    create_campaign: <Mail className="h-4 w-4 text-amber-500" />,
    generate_message_variants: <MessageSquare className="h-4 w-4 text-purple-500" />
  };

  const toolLabels: any = {
    query_customers: 'Queried Customer Database',
    create_segment: 'Saved Customer Segment',
    get_campaign_stats: 'Retrieved Campaign Stats',
    create_campaign: 'Dispatched Marketing Campaign',
    generate_message_variants: 'Drafted Message Copy'
  };

  const getSummary = () => {
    if (tool.name === 'query_customers') {
      const count = tool.output?.count ?? 'X';
      const city = tool.input?.filters?.city ? ` in ${tool.input.filters.city}` : '';
      const tags = tool.input?.filters?.tags ? ` tag: ${tool.input.filters.tags}` : '';
      return `Found ${count} matching customers${city}${tags}`;
    }
    if (tool.name === 'create_segment') {
      return `Created segment "${tool.input.name}" with ${tool.output?.customerCount ?? 'X'} customers`;
    }
    if (tool.name === 'create_campaign') {
      const channel = tool.input.channel;
      return `Dispatched ${channel} campaign: "${tool.input.name}"`;
    }
    if (tool.name === 'get_campaign_stats') {
      const totalCount = tool.output?.campaigns?.length || 0;
      return totalCount > 0 ? `Loaded stats for ${totalCount} active campaigns` : `Loaded stats details`;
    }
    if (tool.name === 'generate_message_variants') {
      return `Created 3 copy variants for goal: "${tool.input.goal}"`;
    }
    return `Completed action`;
  };

  return (
    <div className="w-full border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden text-xs">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-white border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            {icons[tool.name] || <ClipboardCheck className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{toolLabels[tool.name] || tool.name}</div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{getSummary()}</div>
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col gap-2 font-mono">
          <div>
            <span className="font-semibold text-[10px] uppercase text-slate-400 tracking-wider">Arguments</span>
            <pre className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-850 overflow-x-auto text-[10px] text-slate-700 dark:text-slate-300">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {tool.output && (
            <div>
              <span className="font-semibold text-[10px] uppercase text-slate-400 tracking-wider">Database Response</span>
              <pre className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-850 overflow-x-auto text-[10px] text-slate-700 dark:text-slate-300 max-h-[150px] overflow-y-auto">
                {JSON.stringify(tool.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
