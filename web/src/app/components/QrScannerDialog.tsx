import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import jsQR from 'jsqr';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';

const QR_PAYLOAD_PREFIX = 'POOL_INVITE:';

type ScanState = 'requesting' | 'streaming' | 'capturing' | 'success' | 'error';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrScannerDialog({ open, onOpenChange }: QrScannerDialogProps) {
  const qc = useQueryClient();
  const accept = useMutation({
    mutationFn: (code: string) =>
      api<{ poolId: string; userId: string; role: string }>(
        `/invites/${encodeURIComponent(code)}/accept`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pools'] });
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [state, setState] = useState<ScanState>('requesting');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ poolId: string; role: string } | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera on open
  useEffect(() => {
    if (!open) {
      stopCamera();
      setState('requesting');
      setCameraError(null);
      setScanError(null);
      setResultData(null);
      accept.reset();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setState('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setState('streaming');
      } catch (err) {
        if (!cancelled) {
          setCameraError((err as Error)?.message || 'Camera access denied');
          setState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scan: continuously decode QR from camera frames
  useEffect(() => {
    if (state !== 'streaming') return;

    let busy = false;
    const interval = window.setInterval(() => {
      if (busy) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const qr = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });

      if (!qr || !qr.data) return;
      const payload = qr.data;

      if (!payload.startsWith(QR_PAYLOAD_PREFIX)) {
        setScanError('Not a valid pool invite QR');
        return;
      }

      // Parse POOL_INVITE:{poolId}:{inviteCode}
      const remainder = payload.slice(QR_PAYLOAD_PREFIX.length);
      const colonIdx = remainder.indexOf(':');
      if (colonIdx < 1) {
        setScanError('Invalid QR format');
        return;
      }
      const inviteCode = remainder.slice(colonIdx + 1);
      if (!inviteCode) {
        setScanError('Missing invite code');
        return;
      }

      // Found valid QR — stop scanning, accept invite
      busy = true;
      setState('capturing');
      setScanError(null);
      accept.mutate(inviteCode, {
        onSuccess: (data) => {
          setResultData({ poolId: data.poolId, role: data.role });
          setState('success');
          stopCamera();
        },
        onError: (err) => {
          setScanError((err as Error)?.message || 'Failed to join');
          setState('streaming');
          busy = false;
        },
      });
    }, 300); // scan every 300ms

    scanTimerRef.current = interval;
    return () => {
      clearInterval(interval);
      scanTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      {/* Dark overlay */}
      <div
        style={{ position: 'absolute', inset: 0, background: '#000' }}
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 2,
        }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M9 1L1 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M1 1L9 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
            Scan QR Invite
          </p>
          <div style={{ width: 36 }} />
        </div>

        {/* Camera / state area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Hidden video & canvas */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: state === 'streaming' || state === 'capturing' ? 'block' : 'none',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Viewfinder overlay */}
          {(state === 'streaming' || state === 'capturing') && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Dimmed edges */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
              {/* Clear center square */}
              <div style={{
                position: 'relative', width: 250, height: 250,
                borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                zIndex: 1,
              }}>
                {/* Corner accents */}
                {[
                  { top: 0, left: 0, borderTop: '3px solid #005AFF', borderLeft: '3px solid #005AFF', borderRadius: '20px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid #005AFF', borderRight: '3px solid #005AFF', borderRadius: '0 20px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #005AFF', borderLeft: '3px solid #005AFF', borderRadius: '0 0 0 20px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #005AFF', borderRight: '3px solid #005AFF', borderRadius: '0 0 20px 0' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s } as React.CSSProperties} />
                ))}
              </div>
            </div>
          )}

          {/* Requesting camera */}
          {state === 'requesting' && (
            <div style={{ zIndex: 2, textAlign: 'center', padding: 24 }}>
              <Camera size={48} color="#005AFF" strokeWidth={1.5} />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 16 }}>
                Requesting camera access…
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                Please allow camera permissions
              </p>
            </div>
          )}

          {/* Camera error */}
          {state === 'error' && !resultData && (
            <div style={{ zIndex: 2, textAlign: 'center', padding: 24 }}>
              <XCircle size={48} color="#DC2626" strokeWidth={1.5} />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginTop: 16 }}>
                Camera unavailable
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                {cameraError}
              </p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && resultData && (
            <div style={{ zIndex: 2, textAlign: 'center', padding: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(22,163,106,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={40} color="#16A34A" strokeWidth={2} />
              </div>
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
                You're in!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
                Joined as <span style={{ color: '#005AFF', fontWeight: 600 }}>{resultData.role}</span>
              </p>
            </div>
          )}

          {/* Capture error overlay */}
          {state === 'streaming' && scanError && (
            <div style={{
              position: 'absolute', bottom: 100, left: 20, right: 20, zIndex: 3,
              background: 'rgba(220,38,38,0.9)', borderRadius: 14,
              padding: '12px 16px', textAlign: 'center',
            }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>
                {scanError}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0' }}>
                Try again or ask for a new invite
              </p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div style={{
          padding: '20px 20px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          zIndex: 2,
        }}>
          {state === 'streaming' && (
             <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#16A34A',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                }} />
                <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                  Scanning…
                </p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                Point at the QR invite code — auto-detects
              </p>
            </>
          )}

          {state === 'capturing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#005AFF', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                Verifying…
              </p>
            </div>
          )}

          {state === 'success' && (
            <button
              onClick={() => onOpenChange(false)}
              style={{
                width: '100%', height: 52, borderRadius: 999,
                background: '#16A34A', border: 'none',
                fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 16px rgba(22,163,106,0.3)',
              }}
            >
              Done
            </button>
          )}

          {state === 'error' && (
            <button
              onClick={() => onOpenChange(false)}
              style={{
                width: '100%', height: 52, borderRadius: 999,
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'transparent',
                fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
