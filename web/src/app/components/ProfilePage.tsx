import { useEffect, useState } from 'react';
import svgPaths from '../../imports/Profile/svg-l4tnxfp784';
import {
  Phone, CheckCircle2, MessageCircle, Mail,
  Shield, RefreshCw, Eye, EyeOff, Lock,
  Calendar, ChevronRight, Zap, Info,
} from 'lucide-react';
import {
  CURRENT_USER, getUserStats, maskName,
  POOL_REPORT_DATA, POOL_NAMES, POOL_COLORS,
  DEFAULT_AUTO_CONTRIBS, DEFAULT_ZKP_VISIBILITY,
} from '../data/poolData';
import type { AutoContrib, ZKPPoolVisibility } from '../data/poolData';
import { useMe, usePools, useLogout } from '../../api/hooks';

function initialsOf(name: string | undefined): string {
  if (!name) return '?';
  return name.trim()[0]?.toUpperCase() ?? '?';
}

function maskPhone(phone: string | undefined): string {
  if (!phone) return '';
  // 60123456789 -> 012-345 XXXXX  (best-effort masking)
  const digits = phone.replace(/^\+?60/, '0').replace(/\D/g, '');
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)} XXXXX`;
}

// ─── Shared types ─────────────────────────────────────────────────────────────
type Screen =
  | 'profile'
  | 'zkp'
  | 'autocontrib'
  | 'notifications'
  | 'privacy'
  | 'help'
  | 'appsettings';

// ─── Back button ──────────────────────────────────────────────────────────────
function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)', flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11.5 4L6.5 9L11.5 14" stroke="#005AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── Screen wrapper ───────────────────────────────────────────────────────────
function ScreenWrapper({
  title, onBack, children, bg = '#EBF3FD',
}: {
  title: string; onBack: () => void; children: React.ReactNode; bg?: string;
}) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, background: bg }}>
        <BackButton onBack={onBack} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101828', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '0 20px 100px' }}>{children}</div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: value ? '#005AFF' : '#D1D5DB',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ─── Card container ───────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function Row({ children, border = true }: { children: React.ReactNode; border?: boolean }) {
  return (
    <div style={{
      padding: '16px',
      borderBottom: border ? '1px solid #F3F4F6' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: '#101828', color: '#fff', padding: '10px 20px', borderRadius: 24,
      fontSize: 13, fontWeight: 500, opacity: visible ? 1 : 0, pointerEvents: 'none',
      transition: 'opacity 0.3s', whiteSpace: 'nowrap', zIndex: 999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>
      {msg}
    </div>
  );
}

function useToast() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const show = (m: string) => {
    setMsg(m); setVisible(true);
    setTimeout(() => setVisible(false), 2200);
  };
  return { visible, msg, show };
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: ZKP Identity Display
// ══════════════════════════════════════════════════════════════════════════════
function ZKPIdentityScreen({ onBack }: { onBack: () => void }) {
  const [masterZkp, setMasterZkp] = useState(true);
  const [poolVis, setPoolVis] = useState<ZKPPoolVisibility[]>(DEFAULT_ZKP_VISIBILITY);
  const toast = useToast();

  const togglePool = (poolId: string) => {
    setPoolVis(prev => prev.map(p => p.poolId === poolId ? { ...p, visible: !p.visible } : p));
    toast.show('Pool visibility updated');
  };

  const visibleCount = poolVis.filter(p => p.visible).length;

  return (
    <ScreenWrapper title="ZKP Identity" onBack={onBack}>

      {/* Identity Preview Card */}
      <div style={{
        background: 'linear-gradient(135deg, #005AFF 0%, #0040CC 100%)',
        borderRadius: 20, padding: '20px', marginBottom: 24,
        boxShadow: '0 8px 24px rgba(0,90,255,0.20)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Pool Identity</p>
            <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {masterZkp ? maskName(CURRENT_USER.name) : CURRENT_USER.name}
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {masterZkp ? (
            <EyeOff size={14} color="rgba(255,255,255,0.8)" />
          ) : (
            <Eye size={14} color="rgba(255,255,255,0.8)" />
          )}
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.80)', lineHeight: 1.5 }}>
            {masterZkp
              ? `Identity masked in ${visibleCount} pool report${visibleCount !== 1 ? 's' : ''}. Contributions verified via ZKP.`
              : 'ZKP masking is OFF. Your real name appears in all pool reports.'}
          </p>
        </div>
      </div>

      {/* Master ZKP Toggle */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Master Control</p>
      <Card style={{ marginBottom: 20 }}>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', margin: 0 }}>Enable ZKP Masking</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '3px 0 0' }}>Hide your real name across all pool reports</p>
          </div>
          <Toggle value={masterZkp} onChange={v => { setMasterZkp(v); toast.show(v ? '🔒 ZKP masking enabled' : '👁 ZKP masking disabled'); }} />
        </Row>
      </Card>

      {/* Per-Pool Visibility */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Pool Visibility</p>
      <Card style={{ marginBottom: 20 }}>
        {poolVis.map((pv, i) => {
          const col = POOL_COLORS[pv.poolId] ?? '#005AFF';
          const poolReport = POOL_REPORT_DATA[pv.poolId];
          const myContrib = poolReport?.contributors.find(c => c.name === CURRENT_USER.name);
          return (
            <Row key={pv.poolId} border={i < poolVis.length - 1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: col + '18', border: `1.5px solid ${col}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>{POOL_NAMES[pv.poolId]}</p>
                  <p style={{ fontSize: 11, color: '#6A7282', margin: '2px 0 0' }}>
                    Contributed: <span style={{ fontFamily: 'monospace', color: '#16A34A', fontWeight: 700 }}>+RM {myContrib?.amount ?? 0}</span>
                  </p>
                </div>
              </div>
              <Toggle value={masterZkp ? pv.visible : false} onChange={() => masterZkp && togglePool(pv.poolId)} />
            </Row>
          );
        })}
      </Card>

      {/* How ZKP works */}
      <div style={{
        background: '#F0F9FF', border: '1px solid #E0F2FE', borderRadius: 14, padding: '14px',
        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16,
      }}>
        <Info size={16} color="#005AFF" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>How ZKP Works</p>
          <p style={{ margin: 0, fontSize: 12, color: '#2563EB', lineHeight: 1.6 }}>
            Zero-Knowledge Proofs let you prove you contributed to a pool without revealing who you are. Your identity is cryptographically secured — even pool admins cannot unmask you.
          </p>
        </div>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Auto-Contributions
// ══════════════════════════════════════════════════════════════════════════════
function AutoContributionsScreen({ onBack }: { onBack: () => void }) {
  const pools = usePools();
  const [contribs, setContribs] = useState<AutoContrib[]>(DEFAULT_AUTO_CONTRIBS);
  const toast = useToast();

  // Sync schedule list with the user's actual pools.
  // Each pool gets a default monthly amount (target ÷ 12, fallback RM 75) on day 1.
  useEffect(() => {
    if (pools.data && pools.data.length > 0) {
      setContribs((prev) =>
        pools.data!.map((p) => {
          const existing = prev.find((c) => c.poolId === p.id);
          if (existing) return existing;
          const target = Number(p.targetAmount ?? 0) || 0;
          const defaultAmount = target > 0 ? Math.max(10, Math.round(target / 12)) : 75;
          return {
            poolId: p.id,
            poolName: p.name,
            amount: defaultAmount,
            dayOfMonth: 1,
            active: false,
          };
        }),
      );
    }
  }, [pools.data]);

  const toggleContrib = (poolId: string) => {
    setContribs(prev => prev.map(c => c.poolId === poolId ? { ...c, active: !c.active } : c));
    toast.show('Auto-contribution updated');
  };

  const updateAmount = (poolId: string, delta: number) => {
    setContribs(prev => prev.map(c =>
      c.poolId === poolId ? { ...c, amount: Math.max(10, c.amount + delta) } : c
    ));
  };

  const totalMonthly = contribs.filter(c => c.active).reduce((s, c) => s + c.amount, 0);
  const nextDate = 'May 1, 2026';

  return (
    <ScreenWrapper title="Auto-Contributions" onBack={onBack}>

      {/* Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, #005AFF 0%, #0040CC 100%)',
        borderRadius: 20, padding: '20px', marginBottom: 24,
        boxShadow: '0 8px 24px rgba(0,90,255,0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Commitment</p>
            <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
              RM {totalMonthly.toFixed(2)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              Across {contribs.filter(c => c.active).length} active pool{contribs.filter(c => c.active).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Run</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#fff' }}>{nextDate}</p>
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 10,
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={13} color="rgba(255,255,255,0.8)" />
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.80)' }}>
            Auto-deducted from your TNG eWallet on the 1st of each month
          </p>
        </div>
      </div>

      {/* Per-pool auto-contrib cards */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Pool Schedules</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {contribs.map(c => {
          const col = POOL_COLORS[c.poolId] ?? '#005AFF';
          const poolReport = POOL_REPORT_DATA[c.poolId];
          const memberCount = poolReport?.contributors.length ?? 0;
          return (
            <div key={c.poolId} style={{
              background: '#fff', borderRadius: 16,
              boxShadow: c.active ? `0 2px 12px ${col}22` : '0 1px 3px rgba(0,0,0,0.08)',
              border: c.active ? `1.5px solid ${col}40` : '1.5px solid #F3F4F6',
              overflow: 'hidden', transition: 'all 0.2s',
            }}>
              {/* Row 1: Pool name + toggle */}
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: col + '18', border: `1.5px solid ${col}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: col }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#101828' }}>{c.poolName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6A7282' }}>{memberCount} members · Shared Pool</p>
                  </div>
                </div>
                <Toggle value={c.active} onChange={() => toggleContrib(c.poolId)} />
              </div>

              {/* Row 2: Amount + Date */}
              <div style={{
                borderTop: '1px solid #F9FAFB', padding: '10px 16px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: c.active ? 1 : 0.45, transition: 'opacity 0.2s',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Monthly Amount</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => updateAmount(c.poolId, -25)}
                      disabled={!c.active}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${col}60`,
                        background: col + '10', color: col, fontSize: 16, fontWeight: 700,
                        cursor: c.active ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >−</button>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#101828', fontFamily: 'monospace', minWidth: 72, textAlign: 'center' }}>
                      RM {c.amount}
                    </span>
                    <button
                      onClick={() => updateAmount(c.poolId, 25)}
                      disabled={!c.active}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${col}60`,
                        background: col + '10', color: col, fontSize: 16, fontWeight: 700,
                        cursor: c.active ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Deduction Day</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                    <Calendar size={13} color={col} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Day {c.dayOfMonth}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#16A34A', fontWeight: 600 }}>
                    {c.active ? 'Next: May ' + c.dayOfMonth : 'Paused'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Info size={16} color="#D97706" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          Auto-contributions are deducted directly from your linked TNG eWallet balance. Ensure sufficient balance before each deduction date to avoid pool payment failures.
        </p>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Notifications
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({
    paymentReceived: true, paymentSent: true, tripReminders: true,
    memberActivity: true, poolUpdates: true, promotions: false,
    weeklyReport: true, appUpdates: false,
  });
  const toast = useToast();
  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const groups = [
    {
      title: 'Payments',
      items: [
        { key: 'paymentReceived', label: 'Payment Received', desc: 'When someone pays into your pool' },
        { key: 'paymentSent',    label: 'Payment Sent',     desc: 'Confirmation when you pay' },
      ],
    },
    {
      title: 'Group Activity',
      items: [
        { key: 'tripReminders',  label: 'Pool Reminders',   desc: 'Upcoming pool contribution alerts' },
        { key: 'memberActivity', label: 'Member Activity',  desc: 'When members join or leave' },
        { key: 'poolUpdates',    label: 'Pool Updates',     desc: 'Changes to pool budget or goals' },
      ],
    },
    {
      title: 'General',
      items: [
        { key: 'promotions',   label: 'Promotions & Offers', desc: 'Exclusive TNG deals' },
        { key: 'weeklyReport', label: 'Weekly Report',       desc: 'Your spending summary' },
        { key: 'appUpdates',   label: 'App Updates',         desc: 'New features and improvements' },
      ],
    },
  ];

  return (
    <ScreenWrapper title="Notifications" onBack={onBack}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {group.title}
          </p>
          <Card>
            {group.items.map((item, i) => (
              <Row key={item.key} border={i < group.items.length - 1}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>{item.desc}</p>
                </div>
                <Toggle
                  value={settings[item.key as keyof typeof settings]}
                  onChange={() => { toggle(item.key as keyof typeof settings); toast.show('Preferences saved'); }}
                />
              </Row>
            ))}
          </Card>
        </div>
      ))}
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Privacy & Security
// ══════════════════════════════════════════════════════════════════════════════
function PrivacySecurity({ onBack }: { onBack: () => void }) {
  const [faceId, setFaceId] = useState(true);
  const [twoFa, setTwoFa] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const toast = useToast();

  const handlePin = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin]; next[idx] = val; setPin(next);
    if (val && idx < 5) {
      const el = document.getElementById(`pin-${idx + 1}`);
      if (el) (el as HTMLInputElement).focus();
    }
  };

  return (
    <ScreenWrapper title="Privacy & Security" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Authentication</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Face ID / Fingerprint</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Unlock app with biometrics</p>
          </div>
          <Toggle value={faceId} onChange={v => { setFaceId(v); toast.show(v ? '🔐 Biometrics enabled' : 'Biometrics disabled'); }} />
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Two-Factor Authentication</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Extra security via SMS OTP</p>
          </div>
          <Toggle value={twoFa} onChange={v => { setTwoFa(v); toast.show(v ? '2FA enabled' : '2FA disabled'); }} />
        </Row>
      </Card>

      {/* ZKP + Pool Privacy row */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Pool Privacy (ZKP)</p>
      <Card style={{ marginBottom: 20 }}>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Hide Balance</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Mask balance on home screen</p>
          </div>
          <Toggle value={hideBalance} onChange={v => { setHideBalance(v); toast.show(v ? '🙈 Balance hidden' : 'Balance visible'); }} />
        </Row>
      </Card>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>PIN</p>
      <Card style={{ marginBottom: 20 }}>
        {!showPin ? (
          <button onClick={() => setShowPin(true)} style={{ width: '100%', padding: 16, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Change PIN</p>
              <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Update your 6-digit security PIN</p>
            </div>
            <span style={{ color: '#99A1AF', fontSize: 16 }}>›</span>
          </button>
        ) : (
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#101828', marginBottom: 14, textAlign: 'center' }}>Enter New PIN</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
              {pin.map((d, i) => (
                <input
                  key={i} id={`pin-${i}`} type="password" maxLength={1} value={d}
                  onChange={e => handlePin(i, e.target.value)}
                  style={{ width: 42, height: 48, borderRadius: 10, border: d ? '2px solid #005AFF' : '1.5px solid #E5E7EB', textAlign: 'center', fontSize: 20, fontWeight: 700, outline: 'none', background: '#FAFAFA', color: '#101828' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPin(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowPin(false); setPin(['', '', '', '', '', '']); toast.show('🔒 PIN updated!'); }} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#005AFF', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save PIN</button>
            </div>
          </div>
        )}
      </Card>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Active Sessions</p>
      <Card style={{ marginBottom: 20 }}>
        {[
          { device: 'iPhone 15 Pro', location: 'Kuala Lumpur, MY', time: 'Now', current: true },
          { device: 'Chrome – MacBook', location: 'Petaling Jaya, MY', time: '2 hrs ago', current: false },
        ].map((s, i, arr) => (
          <Row key={i} border={i < arr.length - 1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.current ? '#EBF3FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {s.current ? '📱' : '💻'}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#101828', margin: 0 }}>{s.device}</p>
                <p style={{ fontSize: 11, color: '#6A7282', margin: '2px 0 0' }}>{s.location} · {s.time}</p>
              </div>
            </div>
            {s.current ? (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', background: '#F0FDF4', padding: '3px 8px', borderRadius: 20 }}>Current</span>
            ) : (
              <button onClick={() => toast.show('Session ended')} style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>End</button>
            )}
          </Row>
        ))}
      </Card>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Help & Support
// ══════════════════════════════════════════════════════════════════════════════
function HelpSupport({ onBack }: { onBack: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketMsg, setTicketMsg] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const toast = useToast();

  const faqs = [
    { q: 'How do I create a group pool?', a: 'Tap the "+" button on the home screen, choose "Create Pool", set a name and budget, then invite your pool companions.' },
    { q: 'Can I split expenses unequally?', a: 'Yes! When logging an expense, tap "Custom Split" to assign specific amounts or percentages to each member.' },
    { q: 'How do I withdraw from a pool?', a: 'Go to the pool, tap "Manage" → "Withdraw Funds". Funds are transferred to your TNG e-wallet within 1 business day.' },
    { q: 'What currencies are supported?', a: 'Currently Malaysian Ringgit (MYR) only. Multi-currency support is coming in Q3 2026.' },
    { q: 'Is my money safe in a pool?', a: 'Yes. All pool funds are secured by TNG Digital\'s licensed e-money safeguarding, covered under BNM regulations.' },
  ];

  return (
    <ScreenWrapper title="Help & Support" onBack={onBack}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { icon: <MessageCircle size={22} color="#0055D6" />, label: 'Live Chat', sub: 'Avg 2 min reply' },
          { icon: <Phone size={22} color="#0055D6" />,         label: 'Call Us',   sub: '1800-88-1233'  },
          { icon: <Mail size={22} color="#0055D6" />,          label: 'Email',     sub: '24h response'  },
        ].map((a, i) => (
          <button key={i} onClick={() => toast.show(`Opening ${a.label}...`)} style={{ flex: 1, padding: '14px 8px', borderRadius: 14, background: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {a.icon}
            <span style={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>{a.label}</span>
            <span style={{ fontSize: 10, color: '#6A7282' }}>{a.sub}</span>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>FAQs</p>
      <Card style={{ marginBottom: 20 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#101828', flex: 1, paddingRight: 8 }}>{f.q}</span>
              <span style={{ color: '#99A1AF', fontSize: 16, transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
            </button>
            {openFaq === i && <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 13, color: '#4A5565', lineHeight: 1.6 }}>{f.a}</p>}
          </div>
        ))}
      </Card>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Submit a Ticket</p>
      {!showTicket ? (
        <button onClick={() => setShowTicket(true)} style={{ width: '100%', padding: 16, borderRadius: 16, border: '2px dashed #CBD5E1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#005AFF' }}>
          <span>📝</span> Write to us
        </button>
      ) : (
        <Card>
          <div style={{ padding: 16 }}>
            <textarea value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} placeholder="Describe your issue in detail..." rows={4} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#101828', background: '#FAFAFA', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowTicket(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowTicket(false); setTicketMsg(''); toast.show('📨 Ticket submitted!'); }} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#005AFF', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </Card>
      )}
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: App Settings
// ══════════════════════════════════════════════════════════════════════════════
function AppSettingsScreen({ onBack }: { onBack: () => void }) {
  const [currency, setCurrency] = useState('MYR');
  const [language, setLanguage] = useState('Bahasa Malaysia');
  const [darkMode, setDarkMode] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [autoLock, setAutoLock] = useState('1 min');
  const toast = useToast();

  return (
    <ScreenWrapper title="App Settings" onBack={onBack}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Display</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Dark Mode</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Switch to dark theme</p>
          </div>
          <Toggle value={darkMode} onChange={v => { setDarkMode(v); toast.show(v ? '🌙 Dark mode on' : '☀️ Light mode on'); }} />
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Compact View</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Show more content on screen</p>
          </div>
          <Toggle value={compactView} onChange={v => { setCompactView(v); toast.show('View updated'); }} />
        </Row>
      </Card>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Preferences</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Currency</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Default display currency</p>
          </div>
          <select value={currency} onChange={e => { setCurrency(e.target.value); toast.show(`Currency: ${e.target.value}`); }} style={{ fontSize: 13, fontWeight: 600, color: '#005AFF', background: '#EBF3FF', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <option>MYR</option><option>USD</option><option>SGD</option><option>EUR</option>
          </select>
        </Row>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Language</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>App display language</p>
          </div>
          <select value={language} onChange={e => { setLanguage(e.target.value); toast.show(`Language: ${e.target.value}`); }} style={{ fontSize: 13, fontWeight: 600, color: '#005AFF', background: '#EBF3FF', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <option>Bahasa Malaysia</option><option>English</option><option>中文</option><option>தமிழ்</option>
          </select>
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Auto-Lock</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Lock app when idle</p>
          </div>
          <select value={autoLock} onChange={e => { setAutoLock(e.target.value); toast.show(`Auto-lock: ${e.target.value}`); }} style={{ fontSize: 13, fontWeight: 600, color: '#005AFF', background: '#EBF3FF', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <option>30 sec</option><option>1 min</option><option>5 min</option><option>Never</option>
          </select>
        </Row>
      </Card>

      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>System</p>
      <Card style={{ marginBottom: 20 }}>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Haptic Feedback</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Vibration on interactions</p>
          </div>
          <Toggle value={haptics} onChange={v => { setHaptics(v); toast.show(v ? 'Haptics enabled' : 'Haptics disabled'); }} />
        </Row>
      </Card>

      <Card>
        {[{ label: 'App Version', value: '3.2.1 (Build 204)' }, { label: 'Terms of Service', value: '›' }, { label: 'Privacy Policy', value: '›' }].map((item, i, arr) => (
          <button key={i} onClick={() => toast.show(`Opening ${item.label}...`)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>{item.label}</span>
            <span style={{ fontSize: 13, color: item.value === '›' ? '#99A1AF' : '#6A7282', fontWeight: item.value === '›' ? 700 : 400 }}>{item.value}</span>
          </button>
        ))}
      </Card>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => toast.show('Clearing cache...')} style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer' }}>
          Clear Cache
        </button>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG Icons (from Figma import)
// ══════════════════════════════════════════════════════════════════════════════
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 19.997 19.997" fill="none">
      <path d={svgPaths.p26cd2ec0} stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
      <path d={svgPaths.p242e1d80} stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
      <path d="M17.4974 9.99849H7.49887" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
    </svg>
  );
}

// ─── Icon wrappers ────────────────────────────────────────────────────────────
function IconBox({ color = '#ECF2FE', children }: { color?: string; children: React.ReactNode }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  );
}
function IconNotifications() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d={svgPaths.p25877f40} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        <path d={svgPaths.p1c3efea0} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
      </svg>
    </IconBox>
  );
}
function IconPrivacy() {
  return (
    <IconBox>
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d={svgPaths.pb666180} fill="#0055D6" />
      </svg>
    </IconBox>
  );
}
function IconTNG() {
  return (
    <IconBox>
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
        <path d={svgPaths.p2c1b2700} fill="#0055D6" />
      </svg>
    </IconBox>
  );
}
function IconHelp() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="#0055D6" strokeWidth="1.5" />
        <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5C11.38 5 12.5 6.12 12.5 7.5C12.5 8.88 10 10 10 10V11.5" stroke="#0055D6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="14" r="0.75" fill="#0055D6" />
      </svg>
    </IconBox>
  );
}
function IconAppSettings() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d={svgPaths.ped54800} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        <path d={svgPaths.p3b27f100} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
      </svg>
    </IconBox>
  );
}

// ─── New feature icons ─────────────────────────────────────────────────────────
function IconZKP() {
  return (
    <IconBox color="#EEF2FF">
      <Shield size={20} color="#4F46E5" strokeWidth={2} />
    </IconBox>
  );
}
function IconAutoContrib() {
  return (
    <IconBox color="#ECFDF5">
      <RefreshCw size={20} color="#059669" strokeWidth={2} />
    </IconBox>
  );
}

function Chevron() {
  return <ChevronRight size={18} color="#C4C9D4" strokeWidth={2} />;
}

function SettingsItem({ icon, label, subtitle, onClick, badge }: {
  icon: React.ReactNode; label: string; subtitle: string;
  onClick: () => void; badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', minHeight: 72, background: '#fff',
        borderRadius: 16, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px 0px rgba(0,0,0,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flexShrink: 0 }}>{icon}</div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', margin: 0, lineHeight: '20px' }}>{label}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#6A7282', margin: '2px 0 0', lineHeight: '16px' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {badge}
        <Chevron />
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ProfilePage – data-driven from poolData.ts
// ══════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
  const [screen, setScreen] = useState<Screen>('profile');
  const toast = useToast();
  const me = useMe();
  const pools = usePools();
  const logout = useLogout();

  // ─── Live data from API (with fallback to demo CURRENT_USER) ──────────────
  const userName = me.data?.displayName ?? CURRENT_USER.name;
  const userPhone = me.data?.phone ? maskPhone(me.data.phone) : CURRENT_USER.phone;
  const userInitial = initialsOf(userName);

  // Active pools = pools the user is a member of (backend already filters /pools)
  const activePools = pools.data?.length ?? 0;
  // Sum of contributions across all the user's pools (backend exposes contributedTotal per member; not on /pools list, so fall back to balance)
  const contributed = pools.data?.reduce(
    (sum, p) => sum + (Number(p.currentBalance ?? 0) || 0),
    0,
  ) ?? 0;
  const stats = me.data
    ? { activePools, contributed, spent: 0 }
    : getUserStats(CURRENT_USER.name);
  const activeAutoContribs = DEFAULT_AUTO_CONTRIBS.filter(c => c.active).length;

  // ─── Route to sub-screens ─────────────────────────────────────────────────
  if (screen === 'zkp')         return <ZKPIdentityScreen onBack={() => setScreen('profile')} />;
  if (screen === 'autocontrib') return <AutoContributionsScreen onBack={() => setScreen('profile')} />;
  if (screen === 'notifications') return <NotificationsScreen onBack={() => setScreen('profile')} />;
  if (screen === 'privacy')     return <PrivacySecurity onBack={() => setScreen('profile')} />;
  if (screen === 'help')        return <HelpSupport onBack={() => setScreen('profile')} />;
  if (screen === 'appsettings') return <AppSettingsScreen onBack={() => setScreen('profile')} />;

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#EBF3FD', fontFamily: 'Inter, sans-serif' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0', height: 44 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#101828', letterSpacing: '-0.24px' }}>12:30</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="17" height="11" viewBox="0 0 17 10.667" fill="none"><path d={svgPaths.p26d17600} fill="#101828" /></svg>
          <svg width="16" height="11" viewBox="0 0 15.333 11" fill="none"><path d={svgPaths.p39712400} fill="#101828" /></svg>
          <div style={{ border: '1px solid rgba(16,24,40,0.4)', borderRadius: 2.5, width: 22, height: 11, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
            <div style={{ background: '#101828', borderRadius: 1.2, width: 17, height: 7 }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '28px 20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#101828', margin: 0, lineHeight: '32px' }}>Profile</h1>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#4A5565', margin: '6px 0 0', lineHeight: '20px' }}>
          Welcome, {userName} 👋{me.isLoading ? ' …' : ''}
        </p>
      </div>

      {/* ─── Blue User Card with Live Stats ──────────────────────────────── */}
      <div style={{
        margin: '20px 20px 0',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0px 8px 24px 0px rgba(0,90,255,0.15)',
        background: 'radial-gradient(ellipse at 50% 50%, #064187 0%, #0059BD 47%, #0A6EB6 74%, #1483AE 100%)',
        position: 'relative',
      }}>
        {/* Glossy highlight */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '55%', background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />

        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 24px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.30)' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{userInitial}</span>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, lineHeight: '28px' }}>{userName}</p>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#DBEAFE', margin: 0, lineHeight: '20px' }}>{userPhone}</p>
            {/* ZKP masked identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <Shield size={11} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', letterSpacing: '0.3px' }}>
                Pool ID: {maskName(userName)}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3 Live Stats ── */}
        <div style={{ margin: '20px 0 0', borderTop: '0.8px solid rgba(255,255,255,0.20)', padding: '16px 0', display: 'flex' }}>
          {/* Stat 1: Active Pools */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '0.8px solid rgba(255,255,255,0.20)' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, lineHeight: '32px' }}>
              {stats.activePools}
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#DBEAFE', margin: '2px 0 0', lineHeight: '16px' }}>Active Pools</p>
          </div>

          {/* Stat 2: Contributed */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '0.8px solid rgba(255,255,255,0.20)', padding: '0 4px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#4ADE80', margin: 0, lineHeight: '32px', letterSpacing: '-0.3px' }}>
              +{stats.contributed}
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#DBEAFE', margin: '2px 0 0', lineHeight: '16px' }}>Contributed</p>
          </div>

          {/* Stat 3: Spent */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#FCA5A5', margin: 0, lineHeight: '32px', letterSpacing: '-0.3px' }}>
              -{stats.spent}
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#DBEAFE', margin: '2px 0 0', lineHeight: '16px' }}>Spent</p>
          </div>
        </div>

        {/* TNG Connected strip */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderTop: '0.8px solid rgba(255,255,255,0.12)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: 500 }}>TNG eWallet</span>
          </div>
          <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 700 }}>Connected ✓</span>
        </div>
      </div>

      {/* ─── Settings List ─────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Section Label: KongsiGo Features ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          KongsiGo Features
        </p>

        {/* ZKP Identity Display */}
        <SettingsItem
          icon={<IconZKP />}
          label="ZKP Identity Display"
          subtitle="Manage your masked name in pools"
          onClick={() => setScreen('zkp')}
          badge={
            <span style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 20 }}>
              ON
            </span>
          }
        />

        {/* Auto-Contributions */}
        <SettingsItem
          icon={<IconAutoContrib />}
          label="Auto-Contributions"
          subtitle="Manage recurring monthly top-ups"
          onClick={() => setScreen('autocontrib')}
          badge={
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: 20 }}>
              {activeAutoContribs} active
            </span>
          }
        />

        {/* ── Section Label: Account ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '8px 0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Account
        </p>

        {/* Notifications */}
        <SettingsItem icon={<IconNotifications />} label="Notifications" subtitle="Manage alerts & reminders" onClick={() => setScreen('notifications')} />

        {/* Privacy & Security */}
        <SettingsItem icon={<IconPrivacy />} label="Privacy & Security" subtitle="Manage ZKP masking & pool visibility" onClick={() => setScreen('privacy')} />

        {/* TNG Wallet Integration – read-only */}
        <div style={{ width: '100%', minHeight: 72, background: '#fff', borderRadius: 16, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconTNG />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', margin: 0, lineHeight: '20px' }}>TNG Wallet Integration</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#6A7282', margin: '2px 0 0', lineHeight: '16px' }}>Funding source: Main TNG Balance</p>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', background: '#F0FDF4', padding: '6px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} color="#16A34A" />
            <span>Connected</span>
          </div>
        </div>

        {/* ── Section Label: More ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '8px 0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          More
        </p>

        <SettingsItem icon={<IconHelp />} label="Help & Support" subtitle="Get assistance" onClick={() => setScreen('help')} />
        <SettingsItem icon={<IconAppSettings />} label="App Settings" subtitle="Preferences & language" onClick={() => setScreen('appsettings')} />
      </div>

      {/* Log Out */}
      <div style={{ padding: '24px 20px 100px' }}>
        <button
          onClick={() => { toast.show('👋 Logging out...'); logout.mutate(); }}
          disabled={logout.isPending}
          style={{
            width: '100%', padding: 16, borderRadius: 16,
            border: '1.5px solid #FEE2E2', background: '#fff',
            fontSize: 14, fontWeight: 700, color: '#EF4444',
            cursor: logout.isPending ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            opacity: logout.isPending ? 0.6 : 1,
          }}
        >
          <LogoutIcon />
          <span>{logout.isPending ? 'Logging out…' : 'Log Out'}</span>
        </button>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
