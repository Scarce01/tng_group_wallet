import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, X, QrCode, Shield, Users, Zap, Loader2, Store, Delete, Camera } from 'lucide-react';
import jsQR from 'jsqr';
import { usePaymentApproval } from '../../api/hooks';

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

interface MerchantInfo {
  merchantId: string;
  name: string;
  category: string;
}

type ScanStep = 'scanning' | 'amount' | 'confirm' | 'approving' | 'success' | 'failed';

function parseMerchantQR(data: string): MerchantInfo | null {
  try {
    const obj = JSON.parse(data);
    if (obj.merchantId && obj.name && obj.category) return obj as MerchantInfo;
  } catch { /* not JSON — ignore */ }
  return null;
}

const F = 'Inter, sans-serif';

function NumPad({ value, onChange, onConfirm, maxAmount }: {
  value: string; onChange: (v: string) => void; onConfirm: () => void; maxAmount: number;
}) {
  const parsed = parseFloat(value || '0');
  const overLimit = parsed > maxAmount;
  const isEmpty = !value || parsed === 0;

  const press = useCallback((key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.' && value.includes('.')) return;
    // Max 2 decimal places
    const dot = value.indexOf('.');
    if (dot !== -1 && value.length - dot > 2) return;
    // Max 6 digits before decimal
    if (key !== '.' && dot === -1 && value.replace('.', '').length >= 6) return;
    onChange(value + key);
  }, [value, onChange]);

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del'];

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        padding: '0 20px', marginBottom: 16,
      }}>
        {keys.map(k => (
          <button
            key={k}
            onClick={() => press(k)}
            style={{
              height: 54, borderRadius: 14, border: 'none',
              background: k === 'del' ? '#FEE2E2' : '#F3F4F6',
              color: k === 'del' ? '#DC2626' : '#1A1A1A',
              fontSize: k === 'del' ? 0 : 22, fontWeight: 600,
              cursor: 'pointer', fontFamily: F,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.1s',
            }}
          >
            {k === 'del' ? <Delete size={22} color="#DC2626" /> : k}
          </button>
        ))}
      </div>
      {overLimit && (
        <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', margin: '0 0 8px', fontFamily: F }}>
          Exceeds pool balance (RM {maxAmount.toFixed(2)})
        </p>
      )}
      <div style={{ padding: '0 20px 28px' }}>
        <button
          onClick={onConfirm}
          disabled={isEmpty || overLimit}
          className="press-scale"
          style={{
            width: '100%', height: 54, borderRadius: 999, border: 'none',
            background: isEmpty || overLimit ? '#D1D5DB' : 'linear-gradient(135deg, #0059BD, #005AFF)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: isEmpty || overLimit ? 'default' : 'pointer',
            fontFamily: F,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: isEmpty || overLimit ? 'none' : '0 4px 20px rgba(0, 90, 255, 0.35)',
            transition: 'all 0.2s',
          }}
        >
          Continue · RM {parsed.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

export function PoolScanPayDialog({ open, onOpenChange, pool }: PoolScanPayDialogProps) {
  const [step, setStep] = useState<ScanStep>('scanning');
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paymentApproval = usePaymentApproval();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number>(0);

  const amount = parseFloat(amountStr || '0');

  const stopCamera = useCallback(() => {
    scanLoopRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Scan loop
      const loopId = ++scanLoopRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      const tick = () => {
        if (loopId !== scanLoopRef.current) return; // stale
        const video = videoRef.current;
        if (video && canvas && ctx && video.readyState >= 2) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) {
            const m = parseMerchantQR(code.data);
            if (m) {
              stopCamera();
              setMerchant(m);
              setStep('amount');
              return;
            }
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setScanError('Camera access denied. Please allow camera permission.');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (open && step === 'scanning') {
      startCamera();
    }
    return () => { if (step === 'scanning') stopCamera(); };
  }, [open, step, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setStep('scanning');
      setScanError(null);
      setError(null);
      setMerchant(null);
      setAmountStr('');
    }
  }, [open, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
    setTimeout(() => {
      setStep('scanning');
      setScanError(null);
      setError(null);
      setMerchant(null);
      setAmountStr('');
    }, 300);
  };

  const handleSecurePay = async () => {
    if (!pool || !merchant || amount <= 0) return;
    setStep('approving');
    setError(null);
    try {
      await paymentApproval.mutateAsync({
        poolId: pool.id,
        amount,
        merchantName: merchant.name,
        category: merchant.category,
      });
      setStep('success');
      setTimeout(() => handleClose(), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setStep('failed');
    }
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
          maxHeight: '92vh',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── SCANNING (real camera + jsQR) ── */}
        {step === 'scanning' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 16px' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: F }}>Scan QR Code</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', fontFamily: F }}>
                  Paying from <span style={{ color: '#005AFF', fontWeight: 700 }}>{pool.name}</span>
                </p>
              </div>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#374151" />
              </button>
            </div>

            {/* Pool mini card */}
            <div style={{ margin: '0 20px 16px' }}>
              <div style={{
                borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden',
                background: hasPhoto ? '#1a1a1a' : cardBg,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {hasPhoto && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img src={pool.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(6px)', transform: 'scale(1.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                  </div>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: F }}>{pool.name} Pool</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '2px 0 0', fontFamily: F }}>RM {pool.currentBalance.toFixed(2)}</p>
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '4px 10px' }}>
                  <Users size={12} color="rgba(255,255,255,0.9)" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontFamily: F }}>{pool.members.length}</span>
                </div>
              </div>
            </div>

            {/* Camera viewport */}
            <div style={{ margin: '0 20px 16px' }}>
              <div style={{
                height: 280, borderRadius: 20, background: '#0A0A14',
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Live video feed */}
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  playsInline muted autoPlay
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Corner brackets overlay */}
                {[{ top: 20, left: 20 }, { top: 20, right: 20 }, { bottom: 20, left: 20 }, { bottom: 20, right: 20 }].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 28, height: 28,
                    borderTop: i < 2 ? '3px solid #005AFF' : 'none',
                    borderBottom: i >= 2 ? '3px solid #005AFF' : 'none',
                    borderLeft: i === 0 || i === 2 ? '3px solid #005AFF' : 'none',
                    borderRight: i === 1 || i === 3 ? '3px solid #005AFF' : 'none',
                    borderRadius: i === 0 ? '6px 0 0 0' : i === 1 ? '0 6px 0 0' : i === 2 ? '0 0 0 6px' : '0 0 6px 0',
                  }} />
                ))}

                {/* Animated scan line */}
                <div className="scan-line" style={{
                  position: 'absolute', left: 16, right: 16, height: 2,
                  background: 'linear-gradient(90deg, transparent, #005AFF, transparent)',
                  boxShadow: '0 0 12px rgba(0, 90, 255, 0.8)', borderRadius: 1,
                }} />

                {/* Camera error fallback */}
                {scanError && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: '#0A0A14', gap: 12,
                  }}>
                    <Camera size={48} color="rgba(255,255,255,0.3)" />
                    <p style={{ fontSize: 13, color: '#EF4444', margin: 0, fontFamily: F, textAlign: 'center', padding: '0 20px' }}>{scanError}</p>
                    <button
                      onClick={startCamera}
                      style={{
                        padding: '8px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13,
                        cursor: 'pointer', fontFamily: F,
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div style={{ padding: '0 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <QrCode size={16} color="#005AFF" />
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, fontFamily: F }}>Point camera at merchant QR code</span>
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 12px', fontFamily: F }}>
                QR must contain: {`{"merchantId":"...","name":"...","category":"..."}`}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={13} color="#059669" />
                <p style={{ fontSize: 11, color: '#059669', margin: 0, fontFamily: F }}>AI Scam Guard Active — Merchant verified on scan</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ENTER AMOUNT (numpad) ── */}
        {step === 'amount' && merchant && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 12px' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: F }}>Enter Amount</p>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#374151" />
              </button>
            </div>

            {/* Merchant identity from QR */}
            <div style={{
              margin: '0 20px 16px', padding: '14px 16px', borderRadius: 14,
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #0059BD, #1777B1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Store size={22} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: F }}>{merchant.name}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0', fontFamily: F }}>
                  {merchant.category} · <span style={{ color: '#005AFF' }}>{merchant.merchantId}</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', borderRadius: 999, padding: '4px 10px' }}>
                <CheckCircle2 size={12} color="#059669" />
                <span style={{ fontSize: 10, color: '#059669', fontWeight: 600, fontFamily: F }}>VERIFIED</span>
              </div>
            </div>

            {/* Amount display */}
            <div style={{ textAlign: 'center', padding: '8px 20px 20px' }}>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px', fontFamily: F }}>
                Pool Balance: <span style={{ fontWeight: 700, color: '#005AFF' }}>RM {pool.currentBalance.toFixed(2)}</span>
              </p>
              <div style={{
                fontSize: 42, fontWeight: 700, color: '#1A1A1A', fontFamily: F,
                minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 24, color: '#9CA3AF', marginRight: 4 }}>RM</span>
                {amountStr || <span style={{ color: '#D1D5DB' }}>0.00</span>}
              </div>
            </div>

            <NumPad
              value={amountStr}
              onChange={setAmountStr}
              onConfirm={() => setStep('confirm')}
              maxAmount={pool.currentBalance}
            />
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && merchant && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px 16px' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: F }}>Review Payment</p>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#374151" />
              </button>
            </div>

            <div style={{ padding: '0 20px 28px' }}>
              {/* Merchant + amount card */}
              <div style={{
                borderRadius: 20, padding: '20px', marginBottom: 16,
                background: 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -16, left: '40%', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={12} color="#fff" />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0, fontFamily: F, letterSpacing: '0.5px', fontWeight: 600 }}>QR VERIFIED · {merchant.merchantId}</p>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', fontFamily: F }}>{merchant.category}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px', fontFamily: F }}>{merchant.name}</p>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px', fontFamily: F }}>Amount</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F }}>RM {amount.toFixed(2)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px', fontFamily: F }}>From Pool</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F }}>{pool.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', fontFamily: F }}>Balance: RM {pool.currentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Split preview */}
              {pool.members.length > 1 && (
                <div style={{ borderRadius: 14, background: '#ECF2FE', border: '1px solid #BFDBFE', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={16} color="#005AFF" />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#005AFF', margin: 0, fontFamily: F }}>
                      Split among {pool.members.length} members
                    </p>
                    <p style={{ fontSize: 11, color: '#3B82F6', margin: '2px 0 0', fontFamily: F }}>
                      RM {(amount / pool.members.length).toFixed(2)} per person
                    </p>
                  </div>
                </div>
              )}

              {/* AI check */}
              <div style={{ borderRadius: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#059669" />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: 0, fontFamily: F }}>AI Scam Check Passed</p>
                  <p style={{ fontSize: 11, color: '#16A34A', margin: '2px 0 0', fontFamily: F }}>Merchant verified. No suspicious patterns detected.</p>
                </div>
              </div>

              {/* TNG approval notice */}
              <div style={{ borderRadius: 14, background: '#FEF3C7', border: '1px solid #FDE68A', padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#D97706" />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: 0, fontFamily: F }}>TNG Approval Required</p>
                  <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0', fontFamily: F }}>You'll need to approve this payment on your TNG app for security.</p>
                </div>
              </div>

              {/* Edit amount + Secure Pay */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep('amount')}
                  style={{
                    height: 54, borderRadius: 999, border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: F, padding: '0 20px',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleSecurePay}
                  className="press-scale"
                  style={{
                    flex: 1, height: 54, borderRadius: 999, border: 'none',
                    background: 'linear-gradient(135deg, #0059BD, #005AFF)',
                    color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(0, 90, 255, 0.35)',
                  }}
                >
                  <Zap size={18} />
                  Secure Pay · RM {amount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── APPROVING (waiting for TNG app) ── */}
        {step === 'approving' && merchant && (
          <div style={{ padding: '40px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0059BD, #005AFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 24px rgba(0, 90, 255, 0.35)',
            }}>
              <Loader2 size={36} color="#fff" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px', fontFamily: F }}>Waiting for TNG Approval</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 16px', fontFamily: F, lineHeight: '22px' }}>
              Open your <span style={{ fontWeight: 700, color: '#005AFF' }}>TNG eWallet</span> app<br />
              and approve the payment of<br />
              <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 18 }}>RM {amount.toFixed(2)}</span><br />
              to <span style={{ fontWeight: 700 }}>{merchant.name}</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', borderRadius: 999, padding: '8px 20px' }}>
              <Shield size={14} color="#005AFF" />
              <span style={{ fontSize: 12, color: '#005AFF', fontWeight: 600, fontFamily: F }}>HMAC-secured via AWS Lambda</span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && merchant && (
          <div style={{ padding: '40px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="success-icon" style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669, #10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
            }}>
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px', fontFamily: F }}>Payment Successful!</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', fontFamily: F, lineHeight: '22px' }}>
              RM {amount.toFixed(2)} paid to<br />
              <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{merchant.name}</span><br />
              from <span style={{ fontWeight: 700, color: '#005AFF' }}>{pool.name} Pool</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 999, padding: '8px 20px' }}>
              <Shield size={14} color="#059669" />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, fontFamily: F }}>Verified by TNG + AWS Lambda</span>
            </div>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === 'failed' && (
          <div style={{ padding: '40px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
            }}>
              <X size={40} color="#fff" />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px', fontFamily: F }}>Payment Failed</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', fontFamily: F, lineHeight: '22px' }}>
              {error || 'An error occurred during payment approval.'}
            </p>
            <button
              onClick={() => setStep('confirm')}
              style={{
                padding: '12px 32px', borderRadius: 999, border: '1px solid #D1D5DB',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: F,
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
