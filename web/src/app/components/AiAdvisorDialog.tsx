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

interface ChatWidget {
  type: string;
  [key: string]: unknown;
}

interface ChatLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
  widgets?: ChatWidget[];
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

  // Hydrate chat from server history ONLY when the dialog first opens for
  // a given pool. We deliberately do NOT re-hydrate on subsequent
  // messages.data updates — the /agent/ask endpoint doesn't persist the
  // turn server-side, so a refetch returns an empty list and would clobber
  // the user's just-typed message + the assistant's reply.
  const hydratedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      hydratedKeyRef.current = null;
      return;
    }
    if (!messages.data) return;
    const key = `${poolId}:${messages.data.length}`;
    if (hydratedKeyRef.current === key) return;
    if (hydratedKeyRef.current?.startsWith(`${poolId}:`)) return;
    const hydrated: ChatLine[] = messages.data
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.type === 'USER_QUESTION' ? 'user' : 'assistant',
        text: m.content,
      }));
    setChat(hydrated);
    hydratedKeyRef.current = key;
  }, [open, poolId, messages.data]);

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
      const widgets = (res.widgets ?? []) as ChatWidget[];
      setChat((c) =>
        c.map((line) =>
          line.id === pendingId
            ? { ...line, text: reply, pending: false, widgets }
            : line,
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
            <div key={line.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: line.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
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
              {(line.widgets ?? []).map((w, i) => (
                <ChatWidgetRenderer key={i} widget={w} />
              ))}
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

// ─────────────────────── Chat widget renderers ───────────────────────────

function ChatWidgetRenderer({ widget }: { widget: ChatWidget }) {
  switch (widget.type) {
    case 'bar_chart':
      return <BarChartW widget={widget} />;
    case 'line_chart':
      return <LineChartW widget={widget} />;
    case 'transaction_table':
    case 'transaction_history':
      return <TxTableW widget={widget} />;
    case 'metric_grid':
      return <MetricGridW widget={widget} />;
    default:
      return null;
  }
}

const cardStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  maxWidth: '85%',
  width: '100%',
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 12,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 700,
  color: '#0A0A0A',
  fontFamily: 'Inter, sans-serif',
};

interface ChartPoint { label: string; value: number }

function BarChartW({ widget }: { widget: ChatWidget }) {
  const data = (widget.data as ChartPoint[]) ?? [];
  const title = String(widget.title ?? 'Bar chart');
  const unit = String(widget.unit ?? 'RM');
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>{title}</p>
      {data.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>No data.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => {
            const v = Number(d.value) || 0;
            const pct = (v / max) * 100;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', marginBottom: 2 }}>
                  <span>{d.label}</span>
                  <span style={{ fontWeight: 600 }}>{unit} {v.toFixed(2)}</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 6, height: 8 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'linear-gradient(90deg,#005AFF,#4DA3FF)',
                    borderRadius: 6, transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LineChartW({ widget }: { widget: ChatWidget }) {
  const data = (widget.data as ChartPoint[]) ?? [];
  const title = String(widget.title ?? 'Trend');
  const unit = String(widget.unit ?? 'RM');
  const W = 280, H = 120, P = 24;
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const min = Math.min(0, ...data.map((d) => Number(d.value) || 0));
  const range = max - min || 1;
  const xStep = data.length > 1 ? (W - P * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = P + i * xStep;
    const y = H - P - ((Number(d.value) || 0) - min) / range * (H - P * 2);
    return { x, y, value: Number(d.value) || 0, label: d.label };
  });
  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const area = path + ` L${points.at(-1)?.x ?? P},${H - P} L${points[0]?.x ?? P},${H - P} Z`;
  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>{title}</p>
      {data.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>No data.</p>
      ) : (
        <>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            <path d={area} fill="rgba(0,90,255,0.10)" />
            <path d={path} fill="none" stroke="#005AFF" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#005AFF" />
                <text x={p.x} y={H - 4} fontSize="9" textAnchor="middle" fill="#6B7280">
                  {String(p.label).slice(0, 6)}
                </text>
              </g>
            ))}
          </svg>
          <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textAlign: 'right' }}>unit: {unit}</p>
        </>
      )}
    </div>
  );
}

interface TxItem { description?: string; amount?: number; direction?: string; person?: string; date?: string }

function TxTableW({ widget }: { widget: ChatWidget }) {
  const items = (widget.items as TxItem[]) ?? [];
  const title = String(widget.title ?? 'Transactions');
  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>{title}</p>
      {items.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>None.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((t, i) => {
            const out = (t.direction || '').toUpperCase() === 'OUT' || (t.direction || '').toUpperCase() === 'SPEND';
            const amt = Number(t.amount) || 0;
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                fontSize: 12,
              }}>
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ color: '#0A0A0A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.description || '—'}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: 10 }}>
                    {[t.person, t.date ? formatTxDate(t.date) : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: out ? '#DC2626' : '#059669', whiteSpace: 'nowrap' }}>
                  {out ? '−' : '+'}RM {amt.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Metric { label: string; value: number | string; unit?: string }

function MetricGridW({ widget }: { widget: ChatWidget }) {
  const metrics = (widget.metrics as Metric[]) ?? [];
  return (
    <div style={cardStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '8px 10px' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: '#0A0A0A' }}>
              {m.unit ? `${m.unit} ` : ''}{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTxDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });
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
