import { useEffect, useRef, useState } from 'react';
import { X, Send, Zap, ShieldAlert, TrendingDown, Loader2 } from 'lucide-react';
import { useAgentMessages, useAgentAsk } from '../../api/hooks';
import { AiAdvisorIcon } from './AiAdvisorIcon';

interface AiAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  poolName: string;
  onTopUpNow: () => void;
  onReviewFreeze: () => void;
  onSmartCall: () => void;
}

interface ChatLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

const SUGGESTED_PROMPTS = [
  'Any unusual spending in this pool?',
  'How long until our balance runs out?',
  'Should I top up?',
  'Summarise recent transactions',
];

export function AiAdvisorDialog({
  open,
  onOpenChange,
  poolId,
  poolName,
  onTopUpNow,
  onReviewFreeze,
  onSmartCall,
}: AiAdvisorDialogProps) {
  const [input, setInput] = useState('');
  // Local chat overlay — backend persists messages too via /agent/ask
  const [chat, setChat] = useState<ChatLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useAgentMessages(open ? poolId : undefined, 30);
  const ask = useAgentAsk(poolId);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, messages.data]);

  // On open, hydrate chat from server history (most-recent last)
  useEffect(() => {
    if (open && messages.data) {
      const hydrated: ChatLine[] = messages.data
        .slice()
        .reverse()
        .map((m) => ({
          id: m.id,
          role: m.type === 'USER_QUESTION' ? 'user' : 'assistant',
          text: m.content,
        }));
      setChat(hydrated);
    }
  }, [open, messages.data]);

  if (!open) return null;

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || ask.isPending) return;
    const userId = `u-${Date.now()}`;
    const pendingId = `a-${Date.now()}`;
    setChat((c) => [
      ...c,
      { id: userId, role: 'user', text: trimmed },
      { id: pendingId, role: 'assistant', text: '…', pending: true },
    ]);
    setInput('');
    try {
      const res = await ask.mutateAsync({ question: trimmed });
      const reply = res.answer ?? res.text ?? '(no response — backend returned empty body)';
      setChat((c) =>
        c.map((line) =>
          line.id === pendingId ? { ...line, text: reply, pending: false } : line,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reach AI agent';
      setChat((c) =>
        c.map((line) =>
          line.id === pendingId ? { ...line, text: `⚠ ${msg}`, pending: false } : line,
        ),
      );
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full bg-white flex flex-col"
        style={{ borderRadius: '24px 24px 0 0', maxHeight: '85%', minHeight: '60%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue accent top bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #005AFF, #4DA3FF)', borderRadius: '24px 24px 0 0' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AiAdvisorIcon size={38} />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1a1a1a', margin: 0 }}>
                AI Advisor
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '11px', color: '#6B7280', margin: 0 }}>
                {poolName}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{ lineHeight: 0, background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '7px', borderRadius: '50%' }}
          >
            <X size={15} color="#4B5563" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {chat.length === 0 && !messages.isLoading && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              Ask me anything about this pool — spending patterns, voting power, forecast.
            </div>
          )}
          {messages.isLoading && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Loading conversation…
            </div>
          )}
          {chat.map((line) => (
            <div
              key={line.id}
              style={{
                alignSelf: line.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 16,
                background: line.role === 'user' ? '#005AFF' : '#F3F4F6',
                color: line.role === 'user' ? '#fff' : '#111827',
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: line.pending ? 0.7 : 1,
              }}
            >
              {line.pending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={12} className="animate-spin" /> thinking…
                </span>
              ) : (
                line.text
              )}
            </div>
          ))}
        </div>

        {/* Suggested prompts (only when chat empty) */}
        {chat.length === 0 && (
          <div style={{ padding: '0 20px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  color: '#374151',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Quick actions row */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 8px' }}>
          <button
            onClick={() => { onOpenChange(false); setTimeout(onTopUpNow, 120); }}
            title="Top up voting power"
            style={quickActionStyle('#EF4444')}
          >
            <Zap size={13} /> Top Up
          </button>
          <button
            onClick={() => { onOpenChange(false); setTimeout(onReviewFreeze, 120); }}
            title="Review & freeze pool"
            style={quickActionStyle('#D97706')}
          >
            <ShieldAlert size={13} /> Freeze
          </button>
          <button
            onClick={() => { onOpenChange(false); setTimeout(onSmartCall, 120); }}
            title="Initiate smart call"
            style={quickActionStyle('#005AFF')}
          >
            <TrendingDown size={13} /> Smart Call
          </button>
        </div>

        {/* Input */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 20px 20px',
            borderTop: '1px solid #F3F4F6',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask about your pool finances…"
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: '1.5px solid #E5E7EB',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              maxHeight: 80,
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={ask.isPending || !input.trim()}
            style={{
              background: input.trim() ? '#005AFF' : '#CBD5E1',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 14px',
              cursor: ask.isPending || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {ask.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function quickActionStyle(color: string): React.CSSProperties {
  return {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    fontSize: 12,
    fontWeight: 700,
    color,
    background: `${color}10`,
    border: `1px solid ${color}40`,
    borderRadius: 999,
    padding: '7px 10px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  };
}
