import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, QrCode, Shield, Users, Zap } from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  currentBalance: number;
  members: { id: string; name: string; contribution: number; status: string }[];
  color?: string;
  photo?: string;
}

interface PoolScanPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pool: Pool | null;
}

type ScanStep = 'scanning' | 'confirm' | 'success';

// Fake merchants for demo
const FAKE_MERCHANTS = [
  { name: 'Giant Hypermarket', amount: 47.5, category: 'Groceries' },
  { name: '99 Speedmart', amount: 22.0, category: 'Groceries' },
  { name: 'KFC Malaysia', amount: 35.9, category: 'Food & Drinks' },
  { name: 'Restoran Nasi Lemak', amount: 18.0, category: 'Food & Drinks' },
  { name: 'Petronas Station', amount: 60.0, category: 'Fuel' },
];

export function PoolScanPayDialog({ open, onOpenChange, pool }: PoolScanPayDialogProps) {
  const [step, setStep] = useState<ScanStep>('scanning');
  const [merchant] = useState(FAKE_MERCHANTS[Math.floor(Math.random() * FAKE_MERCHANTS.length)]);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep('scanning');
      setScanProgress(0);
      return;
    }
    if (step === 'scanning') {
      const timer = setTimeout(() => setStep('confirm'), 2200);
      const progressTimer = setInterval(() => {
        setScanProgress(p => Math.min(p + 5, 100));
      }, 110);
      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [open, step]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('scanning');
      setScanProgress(0);
    }, 300);
  };

  const handlePay = () => {
    setStep('success');
    setTimeout(() => {
      handleClose();
    }, 2200);
  };

  if (!open || !pool) return null;

  const cardBg = pool.color || 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)';
  const hasPhoto = !!pool.photo;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          borderRadius: '24px 24px 0 0',
          background: '#fff',
          width: '100%',
          overflow: 'hidden',
          maxHeight: '88vh',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 16px' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>Scan QR Code</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>
                  Paying from <span style={{ color: '#005AFF', fontWeight: 700 }}>{pool.name}</span>
                </p>
              </div>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#374151" />
              </button>
            </div>

            {/* Pool mini card */}
            <div style={{ margin: '0 20px 20px' }}>
              <div
                style={{
                  borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden',
                  background: hasPhoto ? '#1a1a1a' : cardBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                {hasPhoto && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img src={pool.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(6px)', transform: 'scale(1.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                  </div>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: 'Inter, sans-serif' }}>{pool.name} Pool</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>RM {pool.currentBalance.toFixed(2)}</p>
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '4px 10px' }}>
                  <Users size={12} color="rgba(255,255,255,0.9)" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{pool.members.length}</span>
                </div>
              </div>
            </div>

            {/* QR Viewport */}
            <div style={{ margin: '0 20px 20px' }}>
              <div
                style={{
                  height: 220,
                  borderRadius: 20,
                  background: '#0A0A14',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Corner brackets */}
                {[{ top: 12, left: 12 }, { top: 12, right: 12 }, { bottom: 12, left: 12 }, { bottom: 12, right: 12 }].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 24, height: 24,
                    borderTop: i < 2 ? '2.5px solid #005AFF' : 'none',
                    borderBottom: i >= 2 ? '2.5px solid #005AFF' : 'none',
                    borderLeft: i === 0 || i === 2 ? '2.5px solid #005AFF' : 'none',
                    borderRight: i === 1 || i === 3 ? '2.5px solid #005AFF' : 'none',
                    borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                  }} />
                ))}
                {/* Scanning line */}
                <div
                  className="scan-line"
                  style={{
                    position: 'absolute', left: 8, right: 8, height: 2,
                    background: 'linear-gradient(90deg, transparent, #005AFF, transparent)',
                    boxShadow: '0 0 8px rgba(0, 90, 255, 0.8)',
                    borderRadius: 1,
                  }}
                />
                {/* QR icon in center */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.4 }}>
                  <QrCode size={56} color="rgba(255,255,255,0.6)" />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Point camera at QR code</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ padding: '0 20px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Scanning...</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#005AFF', fontFamily: 'Inter, sans-serif' }}>{scanProgress}%</span>
              </div>
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${scanProgress}%`, background: '#005AFF', borderRadius: 2, transition: 'width 0.1s linear' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Shield size={13} color="#059669" />
                <p style={{ fontSize: 11, color: '#059669', margin: 0, fontFamily: 'Inter, sans-serif' }}>AI Scam Guard Active — Merchant being verified in real-time</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 16px' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>Review Payment</p>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#374151" />
              </button>
            </div>

            <div style={{ padding: '0 20px 28px' }}>
              {/* Merchant + amount card */}
              <div
                style={{
                  borderRadius: 20, padding: '20px', marginBottom: 16,
                  background: 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -16, left: '40%', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={12} color="#fff" />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px', fontWeight: 600 }}>QR VERIFIED · SAFE</p>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>{merchant.category}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>{merchant.name}</p>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px', fontFamily: 'Inter, sans-serif' }}>Amount</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>RM {merchant.amount.toFixed(2)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px', fontFamily: 'Inter, sans-serif' }}>From Pool</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>{pool.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>Balance: RM {pool.currentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Split preview */}
              {pool.members.length > 1 && (
                <div style={{ borderRadius: 14, background: '#ECF2FE', border: '1px solid #BFDBFE', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={16} color="#005AFF" />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#005AFF', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                      Split among {pool.members.length} members
                    </p>
                    <p style={{ fontSize: 11, color: '#3B82F6', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
                      RM {(merchant.amount / pool.members.length).toFixed(2)} per person
                    </p>
                  </div>
                </div>
              )}

              {/* AI check */}
              <div style={{ borderRadius: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#059669" />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: 0, fontFamily: 'Inter, sans-serif' }}>AI Scam Check Passed</p>
                  <p style={{ fontSize: 11, color: '#16A34A', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>Merchant verified. No suspicious patterns detected.</p>
                </div>
              </div>

              {/* Secure Pay button */}
              <button
                onClick={handlePay}
                className="press-scale"
                style={{
                  width: '100%', height: 54, borderRadius: 999, border: 'none',
                  background: 'linear-gradient(135deg, #0059BD, #005AFF)',
                  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(0, 90, 255, 0.35)',
                }}
              >
                <Zap size={18} />
                Secure Pay · RM {merchant.amount.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ padding: '40px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              className="success-icon"
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #10B981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
              }}
            >
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>Payment Successful!</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', fontFamily: 'Inter, sans-serif', lineHeight: '22px' }}>
              RM {merchant.amount.toFixed(2)} paid to<br />
              <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{merchant.name}</span><br />
              from <span style={{ fontWeight: 700, color: '#005AFF' }}>{pool.name} Pool</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 999, padding: '8px 20px' }}>
              <Shield size={14} color="#059669" />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Protected by AI Guardian</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
