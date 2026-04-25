/**
 * Main Agent — full-screen conversational AI.
 *
 * Replaces the legacy notification bell on the home screen. Renders the
 * conversation history from /agent/conversation and posts new turns via
 * /agent/message. Supports the widget protocol from main-agent-addon.md:
 *   pin_required, confirmation, pool_selector, vote
 * (contact_picker is not yet rendered — backend has no contacts API.)
 */
import { useEffect, useRef, useState } from 'react';
import { Send, X, MoreHorizontal, Loader2, Lock, Check } from 'lucide-react';
import {
  useMainAgentConversation,
  useSendMainAgentMessage,
  useClearMainAgent,
  useConfirmMainAgentAction,
  type MainAgentMessage,
  type MainAgentWidget,
} from '../../api/hooks';
import { MainAgentIcon } from './MainAgentIcon';

interface MainAgentChatProps {
  open: boolean;
  onClose: () => void;
}

export function MainAgentChat({ open, onClose }: MainAgentChatProps) {
  const conversation = useMainAgentConversation();
  const send = useSendMainAgentMessage();
  const clear = useClearMainAgent();
  const confirm = useConfirmMainAgentAction();
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingReply, setPendingReply] = useState<MainAgentMessage | null>(null);
  const [pinDialog, setPinDialog] = useState<MainAgentWidget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine persisted history with the not-yet-saved reply (so user sees
  // their own message + assistant reply immediately, before refetch).
  const messages: MainAgentMessage[] = [
    ...(conversation.data ?? []),
    ...(pendingReply ? [pendingReply] : []),
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!open) return null;

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setInput('');
    setPendingReply({ role: 'user', content: trimmed });
    try {
      const r = await send.mutateAsync({ message: trimmed });
      // Server will refetch conversation; clear local pending
      setPendingReply(null);
      // If a pin_required widget came back, surface the modal
      const pin = r.widgets.find((w) => w.type === 'pin_required');
      if (pin) setPinDialog(pin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not reach agent';
      setPendingReply({ role: 'agent', content: `⚠ ${msg}` });
    }
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: '#fff', display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 16px 14px', borderBottom: '1px solid #F3F4F6',
        background: '#fff', position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: '#F3F4F6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}
          aria-label="Close"
        >
          <X size={16} color="#4B5563" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32 }}>
            <MainAgentIcon size={32} withBackgroundFx={false} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>Agent</span>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: '#F3F4F6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}
          aria-label="Menu"
        >
          <MoreHorizontal size={16} color="#4B5563" />
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 84, right: 16, zIndex: 300,
            background: '#fff', borderRadius: 12, padding: 4,
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 160,
          }}>
            <button
              onClick={() => { setMenuOpen(false); clear.mutate(); }}
              style={{
                width: '100%', padding: '10px 14px', background: 'none',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                fontSize: 13, color: '#EF4444', borderRadius: 8,
              }}
            >
              Clear conversation
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.length === 0 && conversation.isLoading && (
          <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 20 }}>
            <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />
            Loading…
          </div>
        )}
        {messages.length === 0 && !conversation.isLoading && (
          <div style={{
            textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: '40px 20px',
          }}>
            Hi 👋 — ask me about your wallet, pools, votes, or anything you can do in the app.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} message={m} onAction={submit} onPin={setPinDialog} />
        ))}
        {send.isPending && (
          <div style={{ alignSelf: 'flex-start', color: '#94A3B8', fontSize: 12, padding: '4px 8px' }}>
            <Loader2 size={12} className="animate-spin" style={{ display: 'inline', marginRight: 4 }} />
            thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px 24px',
        borderTop: '1px solid #F3F4F6', background: '#fff', alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder="Ask me anything…"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: '1.5px solid #E5E7EB',
            borderRadius: 14, padding: '10px 14px', fontSize: 14,
            outline: 'none', maxHeight: 100, fontFamily: 'Inter, sans-serif',
          }}
        />
        <button
          onClick={() => submit(input)}
          disabled={send.isPending || !input.trim()}
          style={{
            background: input.trim() ? '#005AFF' : '#CBD5E1',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '10px 14px',
            cursor: send.isPending || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Send"
        >
          {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* PIN modal — overlays whole chat when active */}
      {pinDialog && (
        <PinModal
          widget={pinDialog}
          onCancel={() => setPinDialog(null)}
          onConfirm={async (pin) => {
            try {
              await confirm.mutateAsync({
                action: String(pinDialog.action ?? ''),
                params: (pinDialog.params as Record<string, unknown>) ?? {},
              });
              setPinDialog(null);
              // Tell the agent the action succeeded so it can confirm in-chat
              await submit('(confirmed PIN)');
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Confirmation failed';
              setPinDialog(null);
              setPendingReply({ role: 'agent', content: `⚠ ${msg}` });
            }
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────── Message bubble + widgets ────────────────────────

function Bubble({
  message,
  onAction,
  onPin,
}: {
  message: MainAgentMessage;
  onAction: (text: string) => void;
  onPin: (w: MainAgentWidget) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 6,
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: 14,
        background: isUser ? '#005AFF' : '#F3F4F6',
        color: isUser ? '#fff' : '#0A0A0A',
        fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {message.content || ' '}
      </div>
      {(message.widgets ?? []).map((w, i) => (
        <WidgetRenderer key={i} widget={w} onAction={onAction} onPin={onPin} />
      ))}
    </div>
  );
}

function WidgetRenderer({
  widget,
  onAction,
  onPin,
}: {
  widget: MainAgentWidget;
  onAction: (text: string) => void;
  onPin: (w: MainAgentWidget) => void;
}) {
  switch (widget.type) {
    case 'pin_required':
      return <PinRequiredCard widget={widget} onClick={() => onPin(widget)} />;
    case 'confirmation':
      return <ConfirmationCard widget={widget} onConfirm={onAction} />;
    case 'pool_selector':
      return <PoolSelector widget={widget} onPick={onAction} />;
    case 'vote':
      return <VoteCard widget={widget} onVote={onAction} />;
    // Data viz widgets
    case 'transaction_table':
    case 'transaction_history':  // LLM alias
      return <TransactionTable widget={widget} />;
    case 'data_table':
      return <DataTable widget={widget} />;
    case 'bar_chart':
      return <BarChart widget={widget} />;
    case 'line_chart':
      return <LineChart widget={widget} />;
    case 'metric_grid':
      return <MetricGrid widget={widget} />;
    default:
      // Unknown widget — show JSON so it's visible during dev
      return (
        <pre style={{
          alignSelf: 'flex-start', fontSize: 11, color: '#94A3B8',
          background: '#F8FAFC', padding: 8, borderRadius: 8, maxWidth: '85%',
          overflowX: 'auto',
        }}>
          {JSON.stringify(widget, null, 2)}
        </pre>
      );
  }
}

// ─────────────────────── Widget components ───────────────────────────────

function PinRequiredCard({ widget, onClick }: { widget: MainAgentWidget; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignSelf: 'flex-start', maxWidth: '85%',
        background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12,
        padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <Lock size={18} color="#005AFF" />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>
          Confirm with PIN
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
          {String(widget.description ?? widget.action ?? 'Action')}
        </p>
      </div>
    </button>
  );
}

function ConfirmationCard({
  widget,
  onConfirm,
}: {
  widget: MainAgentWidget;
  onConfirm: (text: string) => void;
}) {
  const data = (widget.data as Record<string, unknown>) ?? {};
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '85%',
      background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>
        {String(widget.title ?? 'Confirm')}
      </p>
      <div style={{ fontSize: 12, color: '#374151' }}>
        {Object.entries(data).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, minWidth: 80, color: '#6B7280' }}>{k}:</span>
            <span>{String(v)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onConfirm('confirm')}
          style={{
            flex: 1, background: '#005AFF', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <Check size={12} style={{ display: 'inline', marginRight: 4 }} />
          Confirm
        </button>
        <button
          onClick={() => onConfirm('cancel')}
          style={{
            background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10,
            padding: '8px 12px', fontWeight: 600, fontSize: 12, color: '#6B7280',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function PoolSelector({
  widget,
  onPick,
}: {
  widget: MainAgentWidget;
  onPick: (text: string) => void;
}) {
  const pools = (widget.pools as Array<{ id: string; name: string; type: string; balance: number }>) ?? [];
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '85%',
      background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12,
      padding: 12, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>
        Which pool?
      </p>
      {pools.map((p) => (
        <button
          key={p.id}
          onClick={() => onPick(p.name)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', borderRadius: 10, border: '1px solid #F3F4F6',
            background: '#FAFAFA', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{p.name}</span>
            <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 6 }}>{p.type}</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#005AFF' }}>RM{p.balance}</span>
        </button>
      ))}
    </div>
  );
}

function VoteCard({
  widget,
  onVote,
}: {
  widget: MainAgentWidget;
  onVote: (text: string) => void;
}) {
  const title = String(widget.title ?? 'Pending vote');
  const amount = widget.amount;
  const status = String(widget.currentVotes ?? '');
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '85%',
      background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12,
      padding: 12,
    }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{title}</p>
      <p style={{ margin: '2px 0 8px', fontSize: 11, color: '#6B7280' }}>
        RM{String(amount ?? '?')} · {status}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onVote('approve')} style={voteBtnStyle('#005AFF', '#EFF6FF')}>
          Approve
        </button>
        <button onClick={() => onVote('reject')} style={voteBtnStyle('#6B7280', '#F3F4F6')}>
          Reject
        </button>
      </div>
    </div>
  );
}

function voteBtnStyle(color: string, bg: string): React.CSSProperties {
  return {
    flex: 1, background: bg, border: `1px solid ${color}40`, color,
    borderRadius: 10, padding: '6px 10px', fontWeight: 700, fontSize: 12,
    cursor: 'pointer',
  };
}

// ─────────────────────── Data viz widgets ────────────────────────────────

interface TxRow {
  description?: string;
  amount?: number | string;
  direction?: string; // 'IN' / 'OUT'
  type?: string;
  person?: string;
  user?: { displayName?: string };
  date?: string;
  createdAt?: string;
}

function TransactionTable({ widget }: { widget: MainAgentWidget }) {
  const items =
    (widget.items as TxRow[]) ??
    (widget.data as TxRow[]) ??
    (widget.transactions as TxRow[]) ??
    [];
  const title = String(widget.title ?? 'Transactions');
  return (
    <div style={dataCardStyle()}>
      <p style={dataTitleStyle()}>{title}</p>
      {items.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>No transactions.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((t, i) => {
            const amt = Number(t.amount ?? 0);
            const isOut = t.direction === 'OUT' || t.type === 'SPEND';
            const sign = isOut ? '−' : '+';
            const color = isOut ? '#EF4444' : '#16A34A';
            const date = t.date ?? t.createdAt ?? '';
            const who = t.person ?? t.user?.displayName ?? '';
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                alignItems: 'flex-start', gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(t.description ?? 'Transaction')}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#6B7280' }}>
                    {who && <span>{who}</span>}
                    {who && date && <span> · </span>}
                    {date && <span>{formatTxDate(date)}</span>}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                  {sign}RM{amt.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTxDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface ChartPoint { label: string; value: number }

function BarChart({ widget }: { widget: MainAgentWidget }) {
  const data = (widget.data as ChartPoint[]) ?? [];
  const title = String(widget.title ?? 'Bar Chart');
  const unit = String(widget.unit ?? 'RM');
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div style={dataCardStyle()}>
      <p style={dataTitleStyle()}>{title}</p>
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
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#005AFF,#4DA3FF)',
                    borderRadius: 6,
                    transition: 'width 0.3s',
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

function LineChart({ widget }: { widget: MainAgentWidget }) {
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
    <div style={dataCardStyle()}>
      <p style={dataTitleStyle()}>{title}</p>
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
          <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textAlign: 'right' }}>
            unit: {unit}
          </p>
        </>
      )}
    </div>
  );
}

function DataTable({ widget }: { widget: MainAgentWidget }) {
  const cols = (widget.columns as string[]) ?? [];
  const rows = (widget.rows as Array<Record<string, unknown>>) ?? [];
  const title = String(widget.title ?? 'Data');
  return (
    <div style={dataCardStyle()}>
      <p style={dataTitleStyle()}>{title}</p>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>Empty.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c} style={{ textAlign: 'left', padding: '4px 8px', color: '#6B7280', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c} style={{ padding: '4px 8px', borderBottom: i < rows.length - 1 ? '1px solid #F9FAFB' : 'none', color: '#0A0A0A' }}>
                      {String(r[c] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricGrid({ widget }: { widget: MainAgentWidget }) {
  const metrics = (widget.metrics as Array<{ label: string; value: string | number; unit?: string }>) ?? [];
  return (
    <div style={dataCardStyle()}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`, gap: 8 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {m.label}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#005AFF' }}>
              {m.unit ? `${m.unit} ` : ''}{m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function dataCardStyle(): React.CSSProperties {
  return {
    alignSelf: 'flex-start',
    width: '95%',
    maxWidth: '95%',
    background: '#fff',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Inter, sans-serif',
  };
}

function dataTitleStyle(): React.CSSProperties {
  return {
    margin: '0 0 10px',
    fontSize: 13,
    fontWeight: 700,
    color: '#0A0A0A',
  };
}

// ─────────────────────── PIN modal ───────────────────────────────────────

function PinModal({
  widget,
  onCancel,
  onConfirm,
}: {
  widget: MainAgentWidget;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="#005AFF" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>
            Confirm with PIN
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
          {String(widget.description ?? widget.action)}
        </p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="• • • • • •"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid #E5E7EB', fontSize: 18, textAlign: 'center',
            letterSpacing: 8, outline: 'none', fontFamily: 'Inter, sans-serif',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: '#fff', border: '1.5px solid #E5E7EB',
              borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600,
              color: '#6B7280', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(pin)}
            disabled={pin.length < 6}
            style={{
              flex: 2, background: pin.length === 6 ? '#005AFF' : '#CBD5E1',
              color: '#fff', border: 'none', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 700,
              cursor: pin.length === 6 ? 'pointer' : 'not-allowed',
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
