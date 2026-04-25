import { X, Phone, CheckSquare, Square, Send, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface PoolMember {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
}

interface SmartCallSheetProps {
  open: boolean;
  poolName: string;
  members: PoolMember[];
  onClose: () => void;
  onSendSuccess: () => void;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #005AFF, #4DA3FF)',
  'linear-gradient(135deg, #7C3AED, #A78BFA)',
  'linear-gradient(135deg, #059669, #34D399)',
  'linear-gradient(135deg, #D97706, #FBBF24)',
  'linear-gradient(135deg, #DC2626, #F87171)',
];

const AMOUNT_PER_PERSON = 50;

export function SmartCallSheet({ open, poolName, members, onClose, onSendSuccess }: SmartCallSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => members.map(m => m.id));
  const [message, setMessage] = useState(
    'Hey guys, we need to top up for upcoming bills! Pool is running low 🙏'
  );
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const toggleMember = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const handleSend = () => {
    if (sending || selectedIds.length === 0) return;
    setSending(true);
    setTimeout(() => {
      onSendSuccess();
      onClose();
      setSending(false);
      setSelectedIds(members.map(m => m.id));
    }, 1100);
  };

  const selectedCount = selectedIds.length;
  const totalAmount = selectedCount * AMOUNT_PER_PERSON;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(5px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88%',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'slideUpSheet 0.32s cubic-bezier(0.32,0.72,0,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Blue accent top bar */}
        <div style={{
          height: 5,
          background: 'linear-gradient(90deg, #005AFF 0%, #4DA3FF 60%, #005AFF 100%)',
          flexShrink: 0,
        }} />

        {/* Handle pill */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,90,255,0.18)',
            }}>
              <Phone size={18} color="#005AFF" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Smart Call
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '1px 0 0', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                {poolName} Pool · Contribution Request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#F3F4F6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color="#374151" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 12px' }}>

          {/* AI Insight Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
            border: '1px solid #BFDBFE', borderRadius: 14, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <TrendingDown size={16} color="#005AFF" />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', margin: '0 0 3px', fontFamily: 'Inter, sans-serif' }}>
                AI Prediction Active
              </p>
              <p style={{ fontSize: 12, color: '#2563EB', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: '17px' }}>
                Pool predicted to deplete in <strong>5 days</strong>. Requesting <strong>RM {AMOUNT_PER_PERSON}/person</strong> will cover month-end bills.
              </p>
            </div>
          </div>

          {/* Members section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: '#9CA3AF',
              letterSpacing: '0.9px', fontFamily: 'Inter, sans-serif', margin: 0,
            }}>
              SELECT MEMBERS TO NOTIFY
            </p>
            <button
              onClick={toggleAll}
              style={{
                fontSize: 11, fontWeight: 600, color: '#005AFF',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', padding: 0,
              }}
            >
              {selectedIds.length === members.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {members.map((m, i) => {
              const isSelected = selectedIds.includes(m.id);
              const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isSelected ? '#F0F7FF' : '#F9FAFB',
                    border: `1.5px solid ${isSelected ? '#93C5FD' : '#E5E7EB'}`,
                    borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                      {m.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                      {m.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
                      Contributed RM {m.contribution} ·{' '}
                      <span style={{ color: m.status === 'paid' ? '#059669' : '#D97706', fontWeight: 600 }}>
                        {m.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </p>
                  </div>

                  {/* Request amount badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: isSelected ? '#005AFF' : '#9CA3AF',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      RM {AMOUNT_PER_PERSON}
                    </span>
                  </div>

                  {/* Checkbox */}
                  <div style={{ color: isSelected ? '#005AFF' : '#D1D5DB', flexShrink: 0 }}>
                    {isSelected
                      ? <CheckSquare size={22} />
                      : <Square size={22} />
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message section */}
          <p style={{
            fontSize: 10, fontWeight: 700, color: '#9CA3AF',
            letterSpacing: '0.9px', fontFamily: 'Inter, sans-serif', marginBottom: 8,
          }}>
            MESSAGE (OPTIONAL)
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Add a message for pool members..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#F9FAFB',
              border: '1.5px solid #E5E7EB',
              borderRadius: 12, padding: '12px 14px',
              fontSize: 13, color: '#374151',
              fontFamily: 'Inter, sans-serif',
              outline: 'none', resize: 'none', lineHeight: '20px',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#93C5FD')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 16px 32px',
          borderTop: '1px solid #F3F4F6',
          flexShrink: 0,
          background: '#fff',
        }}>
          {/* Summary row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Mini avatars of selected */}
              <div style={{ display: 'flex' }}>
                {members
                  .filter(m => selectedIds.includes(m.id))
                  .slice(0, 3)
                  .map((m, i) => (
                    <div
                      key={m.id}
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: AVATAR_COLORS[members.indexOf(m) % AVATAR_COLORS.length],
                        border: '1.5px solid #fff',
                        marginLeft: i === 0 ? 0 : -7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {m.name.charAt(0)}
                    </div>
                  ))}
              </div>
              <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {selectedCount} member{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Total request </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#005AFF', fontFamily: 'Inter, sans-serif' }}>
                RM {totalAmount}
              </span>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || selectedCount === 0}
            style={{
              width: '100%', height: 54, borderRadius: 999,
              background: sending || selectedCount === 0
                ? '#D1D5DB'
                : 'linear-gradient(135deg, #005AFF 0%, #1D6EFF 100%)',
              border: 'none',
              cursor: sending || selectedCount === 0 ? 'not-allowed' : 'pointer',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: sending || selectedCount === 0 ? 'none' : '0 4px 18px rgba(0,90,255,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {sending ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Sending Smart Call…
              </>
            ) : (
              <>
                <Send size={17} />
                Send Smart Call (RM {AMOUNT_PER_PERSON} each)
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
