import { X, AlertTriangle, Clock, ArrowUpRight, ShieldOff, Shield } from 'lucide-react';
import { useState } from 'react';

interface FreezePoolSheetProps {
  open: boolean;
  poolName: string;
  onClose: () => void;
  onFreezeSuccess: () => void;
}

const SUSPICIOUS_TXS = [
  { id: 's1', desc: 'Transfer Out', amount: 250, time: '2:14 AM', person: 'Ahmad', note: 'Unusual hour' },
  { id: 's2', desc: '99 Speedmart - Pos Terminal', amount: 180, time: '2:18 AM', person: 'Ahmad', note: '4 min gap' },
  { id: 's3', desc: 'Transfer Out', amount: 320, time: '2:21 AM', person: 'Ahmad', note: '3 min gap' },
];

export function FreezePoolSheet({ open, poolName, onClose, onFreezeSuccess }: FreezePoolSheetProps) {
  const [frozen, setFrozen] = useState(false);

  if (!open) return null;

  const handleFreeze = () => {
    if (frozen) return;
    setFrozen(true);
    setTimeout(() => {
      onFreezeSuccess();
      onClose();
      setFrozen(false);
    }, 1100);
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(5px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
          animation: 'slideUpSheet 0.32s cubic-bezier(0.32,0.72,0,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Red accent top bar */}
        <div style={{
          height: 5,
          background: 'linear-gradient(90deg, #DC2626 0%, #F97316 55%, #EF4444 100%)',
        }} />

        {/* Handle pill */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239,68,68,0.22)',
            }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Security Alert
              </p>
              <p style={{ fontSize: 11, color: '#EF4444', margin: '1px 0 0', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                {poolName} Pool · Unusual Activity
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

        {/* Warning Banner */}
        <div style={{ margin: '0 16px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Shield size={16} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#991B1B', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: '19px' }}>
              <strong>3 rapid transactions</strong> detected from a contributor between 2:14 AM – 2:21 AM.
              Total exposure: <strong>RM 750</strong>. This pattern indicates possible unauthorized access.
            </p>
          </div>
        </div>

        {/* Section label */}
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#9CA3AF',
          letterSpacing: '0.9px', padding: '0 20px 8px',
          fontFamily: 'Inter, sans-serif', margin: 0,
        }}>
          SUSPICIOUS TRANSACTIONS
        </p>

        {/* Transaction list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 16px' }}>
          {SUSPICIOUS_TXS.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                background: i === 0 ? '#FFF7ED' : i === 1 ? '#FFFBEB' : '#FEF2F2',
                border: `1px solid ${i === 0 ? '#FED7AA' : i === 1 ? '#FDE68A' : '#FECACA'}`,
                borderRadius: 12, padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ArrowUpRight size={17} color="#DC2626" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  {tx.desc}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <Clock size={10} color="#9CA3AF" />
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
                    {tx.time} · {tx.person}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#D97706',
                    background: '#FEF3C7', borderRadius: 4,
                    padding: '1px 5px', fontFamily: 'Inter, sans-serif',
                  }}>
                    {tx.note}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                −RM {tx.amount}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#F3F4F6', margin: '0 16px 16px' }} />

        {/* Freeze button */}
        <div style={{ padding: '0 16px 32px' }}>
          <button
            onClick={handleFreeze}
            disabled={frozen}
            style={{
              width: '100%', height: 54, borderRadius: 999,
              background: frozen
                ? 'linear-gradient(135deg, #9CA3AF, #9CA3AF)'
                : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              border: 'none',
              cursor: frozen ? 'not-allowed' : 'pointer',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: frozen ? 'none' : '0 4px 18px rgba(220,38,38,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {frozen ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Freezing Pool…
              </>
            ) : (
              <>
                <ShieldOff size={18} />
                Freeze Pool for 24 Hours
              </>
            )}
          </button>
          <p style={{
            textAlign: 'center', fontSize: 11, color: '#9CA3AF',
            marginTop: 10, fontFamily: 'Inter, sans-serif', lineHeight: '16px',
          }}>
            All pool members will be notified immediately. Pool auto-unfreezes after 24 hours.
          </p>
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
