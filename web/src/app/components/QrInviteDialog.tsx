import { useState, useEffect, useCallback } from 'react';
import { useGenerateQrInvite } from '../../api/hooks';
import { QrCode, RefreshCw, Shield, Clock } from 'lucide-react';

interface QrInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string | undefined;
}

export function QrInviteDialog({ open, onOpenChange, poolId }: QrInviteDialogProps) {
  const generate = useGenerateQrInvite(poolId);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const doGenerate = useCallback(() => {
    if (!poolId) return;
    generate.mutate(undefined, {
      onSuccess: (data) => {
        setSecondsLeft(data.expiresInSeconds);
      },
    });
  }, [poolId, generate]);

  // Auto-generate on open
  useEffect(() => {
    if (open && poolId) {
      doGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, poolId]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          doGenerate(); // auto-regenerate on expiry
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, doGenerate]);

  if (!open) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={() => onOpenChange(false)}
      />
      {/* Bottom sheet */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '28px 20px 32px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0px -4px 24px rgba(0,0,0,0.12)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 28, height: 28, borderRadius: '50%',
            background: '#F3F4F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M9 1L1 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M1 1L9 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#005AFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,90,255,0.3)',
          }}>
            <QrCode size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>
              Invite via QR Code
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
              Show this code for others to scan
            </p>
          </div>
        </div>

        {/* QR display area */}
        <div style={{
          background: '#F9FAFB', borderRadius: 20, padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          border: '1px solid #E5E7EB',
          marginBottom: 16,
        }}>
          {generate.isPending ? (
            <div style={{
              width: 200, height: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #E5E7EB',
                borderTopColor: '#005AFF', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : generate.isError ? (
            <div style={{
              width: 200, height: 200,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#DC2626', fontWeight: 600 }}>
                Failed to generate QR
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                {(generate.error as Error)?.message || 'Unknown error'}
              </p>
            </div>
          ) : generate.data ? (
            <img
              src={generate.data.image}
              alt="Invite QR Code"
              style={{
                width: 200, height: 200, borderRadius: 12,
                imageRendering: 'pixelated',
              }}
            />
          ) : null}

          {/* Countdown */}
          {generate.data && secondsLeft > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 14, padding: '6px 14px',
              background: secondsLeft < 60 ? '#FEF2F2' : '#EFF6FF',
              borderRadius: 20,
            }}>
              <Clock size={14} color={secondsLeft < 60 ? '#DC2626' : '#005AFF'} />
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: secondsLeft < 60 ? '#DC2626' : '#005AFF',
                fontFamily: 'Inter, sans-serif',
              }}>
                Expires in {timeStr}
              </span>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          borderRadius: 12, padding: '10px 14px',
          marginBottom: 16,
        }}>
          <Shield size={16} color="#16A34A" strokeWidth={2.2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>
            Steganographic Security
          </span>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            — hidden HMAC protects against tampering
          </span>
        </div>

        {/* Invite code */}
        {generate.data?.inviteCode && (
          <div style={{
            background: '#F9FAFB', borderRadius: 12,
            padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid #E5E7EB',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', fontWeight: 600, letterSpacing: 0.5 }}>
                INVITE CODE
              </p>
              <p style={{
                margin: '2px 0 0', fontSize: 16, fontWeight: 700,
                color: '#0A0A0A', fontFamily: 'monospace', letterSpacing: 1.5,
              }}>
                {generate.data.inviteCode}
              </p>
            </div>
          </div>
        )}

        {/* Regenerate button */}
        <button
          onClick={doGenerate}
          disabled={generate.isPending}
          style={{
            width: '100%', height: 48, borderRadius: 999,
            border: '1.5px solid #005AFF',
            background: '#fff', cursor: generate.isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700,
            color: '#005AFF', opacity: generate.isPending ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <RefreshCw size={16} strokeWidth={2.2} />
          Regenerate QR Code
        </button>
      </div>
    </div>
  );
}
