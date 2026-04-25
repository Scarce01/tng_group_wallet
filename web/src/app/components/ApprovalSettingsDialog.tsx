import React, { useState } from 'react';
import svgPaths from '../../imports/ManageMembers-6/svg-pt1fhwlysf';

interface ApprovalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
}

type ApprovalMode = 'admin-only' | 'majority' | 'unanimous' | 'any-member';
type SpendingTier = 'low' | 'medium' | 'high';

/* ─── SVG icon primitives matching Figma exactly ─── */

function XCloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M9 1L1 9" stroke="#0A0A0A" strokeWidth="1.33" strokeLinecap="round" />
      <path d="M1 1L9 9" stroke="#0A0A0A" strokeWidth="1.33" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p203476e0} stroke="#101828" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.6667 8H3.33333" stroke="#101828" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p37f49070} stroke="#DBEAFE" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p10a7d900} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.33333 14H12.6667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p32887f80} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3694d280} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1f197700} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3bf3e100} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersCheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p32887f80} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3694d280} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p2d50f500} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p39ee6532} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p17134c00} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Radio dot ─── */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: selected ? '1.6px solid #0055D6' : '1.6px solid #D1D5DC',
    }}>
      {selected && (
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#155DFC' }} />
      )}
    </div>
  );
}

/* ─── Main component ─── */
export function ApprovalSettingsDialog({ open, onOpenChange, poolName }: ApprovalSettingsDialogProps) {
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('unanimous');
  const [selectedTiers, setSelectedTiers] = useState<SpendingTier[]>(['low']);
  const [autoApprove, setAutoApprove] = useState(100);

  if (!open) return null;

  const sliderPct = (autoApprove / 200) * 100;

  const toggleTier = (tier: SpendingTier) => {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const getModeLabel = () => {
    const map: Record<ApprovalMode, string> = {
      'admin-only': 'Admin Only',
      'majority': 'Majority Vote',
      'unanimous': 'Unanimous',
      'any-member': 'Any Member',
    };
    return map[approvalMode];
  };

  const getApprovalLabel = () => {
    if (selectedTiers.length === 0) return 'None';
    if (selectedTiers.length === 3) return 'All tiers';
    const map: Record<SpendingTier, string> = { low: 'Low', medium: 'Medium', high: 'High' };
    return selectedTiers.map(t => map[t]).join(', ');
  };

  const approvalModes: {
    id: ApprovalMode;
    label: string;
    desc: string;
    badge: string;
    icon: (color: string) => React.ReactElement;
  }[] = [
    {
      id: 'admin-only',
      label: 'Admin Only',
      desc: 'Only pool admins can approve spending',
      badge: 'Most Secure',
      icon: (c) => <CrownIcon color={c} />,
    },
    {
      id: 'majority',
      label: 'Majority Vote',
      desc: 'Requires 50%+ member approval',
      badge: 'Recommended',
      icon: (c) => <UsersIcon color={c} />,
    },
    {
      id: 'unanimous',
      label: 'Unanimous',
      desc: 'All members must approve',
      badge: 'Maximum Trust',
      icon: (c) => <UsersCheckIcon color={c} />,
    },
    {
      id: 'any-member',
      label: 'Any Member',
      desc: 'Any member can approve instantly',
      badge: 'Fastest',
      icon: (c) => <CheckCircleIcon color={c} />,
    },
  ];

  const spendingTiers: {
    id: SpendingTier;
    label: string;
    desc: string;
    badge: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    { id: 'low', label: 'Low Spending', desc: 'Under RM 50', badge: 'Low Risk', badgeBg: '#DCFCE7', badgeText: '#008236' },
    { id: 'medium', label: 'Medium Spending', desc: 'RM 50 - RM 200', badge: 'Medium Risk', badgeBg: '#FEF9C2', badgeText: '#A65F00' },
    { id: 'high', label: 'High Spending', desc: 'Above RM 200', badge: 'High Risk', badgeBg: '#FFE2E2', badgeText: '#C10007' },
  ];

  return (
    /* ── Absolute overlay scoped inside the 402×917 phone frame ── */
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>

      {/* Dark backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog panel — starts at y=240, scrollable */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          borderRadius: '24px 24px 0 0',
          border: '0.8px solid rgba(0,0,0,0.1)',
          boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <style>{`.appr-noscroll::-webkit-scrollbar{display:none}`}</style>
        <div className="appr-noscroll" style={{ overflowY: 'auto' }}>

          {/* ── Close (X) button — top right ── */}
          <button
            onClick={() => onOpenChange(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 18,
              opacity: 0.7,
              width: 16, height: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            <XCloseIcon />
          </button>

          {/* ── Header row: back arrow + "Approval Settings" ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingLeft: 18, paddingTop: 42, paddingBottom: 0,
          }}>
            {/* Back button */}
            <button
              onClick={() => onOpenChange(false)}
              style={{
                width: 36, height: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, flexShrink: 0,
              }}
            >
              <ArrowLeftIcon />
            </button>
            {/* Title */}
            <span style={{ fontSize: 18, fontWeight: 700, color: '#101828', lineHeight: '28px', whiteSpace: 'nowrap' }}>
              Approval Settings
            </span>
          </div>

          <div style={{ paddingLeft: 20, paddingRight: 20 }}>

            {/* ── Pool Security Banner ── */}
            <div style={{
              marginTop: 18,
              borderRadius: 16,
              backgroundImage: 'linear-gradient(165.647403deg, rgb(2, 92, 189) 0%, rgb(18, 116, 177) 100%)',
              height: 98,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* "Pool Security" label row */}
              <div style={{
                position: 'absolute', top: 20, left: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <ShieldIcon />
                <span style={{ fontSize: 14, color: '#DBEAFE', fontWeight: 400, lineHeight: '20px' }}>
                  Pool Security
                </span>
              </div>
              {/* Pool name */}
              <div style={{ position: 'absolute', top: 49, left: 20 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: '28px', whiteSpace: 'nowrap' }}>
                  {poolName}
                </span>
              </div>
            </div>

            {/* ── Approval Mode section ── */}
            <div style={{ marginTop: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px', marginBottom: 10 }}>
                Approval Mode
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {approvalModes.map((mode) => {
                  const selected = approvalMode === mode.id;
                  const iconColor = selected ? '#0055D6' : '#364153';
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setApprovalMode(mode.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        height: 75, borderRadius: 16, position: 'relative',
                        background: selected ? '#ECF2FE' : '#fff',
                        border: `1.6px solid ${selected ? '#0055D6' : '#E5E7EB'}`,
                        cursor: 'pointer', display: 'block', flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', left: 17.5, top: 17.5,
                        display: 'flex', alignItems: 'flex-start', gap: 0, width: 'calc(100% - 35px)',
                      }}>
                        {/* Radio */}
                        <RadioDot selected={selected} />
                        {/* Content */}
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', height: 20, position: 'relative' }}>
                            {/* Icon */}
                            <div style={{ marginRight: 6 }}>{mode.icon(iconColor)}</div>
                            {/* Label */}
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px' }}>
                              {mode.label}
                            </span>
                            {/* Badge */}
                            <div style={{
                              position: 'absolute', right: 0,
                              background: '#FEF9C2', borderRadius: 8,
                              padding: '2px 8px',
                              fontSize: 10, fontWeight: 600, color: '#A65F00',
                              lineHeight: '16px', whiteSpace: 'nowrap',
                            }}>
                              {mode.badge}
                            </div>
                          </div>
                          {/* Description */}
                          <p style={{
                            marginTop: 4, fontSize: 12, fontWeight: 500,
                            color: '#4A5565', lineHeight: '16px', margin: '4px 0 0 0',
                            whiteSpace: 'nowrap',
                          }}>
                            {mode.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Require Approval For ── */}
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px', marginBottom: 0 }}>
                Require Approval For
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#4A5565', lineHeight: '16px', margin: '8px 0 10px 0' }}>
                Select spending tiers that need approval
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {spendingTiers.map((tier) => {
                  const selected = selectedTiers.includes(tier.id);
                  return (
                    <button
                      key={tier.id}
                      onClick={() => toggleTier(tier.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        height: 75, borderRadius: 16, position: 'relative',
                        background: selected ? '#ECF2FE' : '#fff',
                        border: `1.6px solid ${selected ? '#0055D6' : '#E5E7EB'}`,
                        cursor: 'pointer', display: 'block', flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', left: 15.9, top: 15.9,
                        display: 'flex', alignItems: 'flex-start', gap: 0, width: 'calc(100% - 31.8px)',
                      }}>
                        {/* Radio */}
                        <RadioDot selected={selected} />
                        {/* Content */}
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', height: 20, position: 'relative' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px' }}>
                              {tier.label}
                            </span>
                            <div style={{
                              position: 'absolute', right: 0,
                              background: tier.badgeBg, borderRadius: 8,
                              padding: '2px 8px',
                              fontSize: 10, fontWeight: 600, color: tier.badgeText,
                              lineHeight: '16px', whiteSpace: 'nowrap',
                            }}>
                              {tier.badge}
                            </div>
                          </div>
                          <p style={{
                            fontSize: 12, fontWeight: 500,
                            color: '#4A5565', lineHeight: '16px', margin: '4px 0 0 0',
                          }}>
                            {tier.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Auto-Approve Threshold ── */}
            <div style={{ marginTop: 24 }}>
              <div style={{
                background: '#fff',
                border: '1.6px solid #E5E7EB',
                borderRadius: 16,
                height: 127,
                position: 'relative',
              }}>
                {/* Row: label + value */}
                <div style={{
                  position: 'absolute', top: 15.9, left: 15.9, right: 15.9,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  height: 32,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#364153', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                    Auto-approve below:
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#0055D6', lineHeight: '32px', whiteSpace: 'nowrap' }}>
                    RM {autoApprove}
                  </span>
                </div>

                {/* Slider track */}
                <div style={{
                  position: 'absolute', top: 70.3, left: 15.9, right: 15.9,
                  height: 8, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${sliderPct}%`, height: '100%',
                    background: '#0055D6', borderRadius: 10,
                  }} />
                </div>

                {/* Slider thumb */}
                <div style={{
                  position: 'absolute',
                  top: 67.4,
                  left: `calc(${15.9}px + ${sliderPct}% * (100% - 31.8px) / 100)`,
                  transform: 'translateX(-50%)',
                  width: 14, height: 14,
                  background: '#0055D6', borderRadius: '50%',
                  pointerEvents: 'none',
                }} />

                {/* Hidden range input */}
                <input
                  type="range" min={0} max={200} step={10} value={autoApprove}
                  onChange={e => setAutoApprove(Number(e.target.value))}
                  style={{
                    position: 'absolute', top: 62, left: 15.9, right: 15.9,
                    width: 'calc(100% - 31.8px)', height: 20,
                    opacity: 0, cursor: 'pointer', zIndex: 1,
                  }}
                />

                {/* Range labels */}
                <div style={{
                  position: 'absolute', top: 91.9, left: 15.9, right: 15.9,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, color: '#6A7282', lineHeight: '16px' }}>RM 0</span>
                  <span style={{ fontSize: 12, color: '#6A7282', lineHeight: '16px' }}>RM 200</span>
                </div>
              </div>
            </div>

            {/* ── Green info box ── */}
            {autoApprove > 0 && (
              <div style={{
                marginTop: 14,
                background: '#F0FDF4',
                border: '1.6px solid #B9F8CF',
                borderRadius: 14,
                padding: '13.5px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flexShrink: 0 }}>
                  <CheckCircleIcon color="#00A63E" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 400, color: '#008236', lineHeight: '16px' }}>
                  Spending under RM {autoApprove} will be approved instantly
                </span>
              </div>
            )}

            {/* ── Current Configuration ── */}
            <div style={{
              marginTop: 14,
              background: '#ECF2FE',
              border: '1px solid #0055D6',
              borderRadius: 16,
              padding: '17.5px',
            }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: '#101828',
                lineHeight: '16px', letterSpacing: '0.05em', marginBottom: 12,
              }}>
                CURRENT CONFIGURATION
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Mode:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>{getModeLabel()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Approval Required:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>{getApprovalLabel()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Auto-approve below:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>RM {autoApprove}</span>
                </div>
              </div>
            </div>

            {/* ── Save Settings button ── */}
            <button
              onClick={() => onOpenChange(false)}
              style={{
                display: 'block', width: '100%',
                marginTop: 20, marginBottom: 30,
                height: 48, borderRadius: 16,
                background: '#0055D6',
                border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#fff',
                textAlign: 'center', lineHeight: '20px',
                boxShadow: '0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)',
              }}
            >
              Save Settings
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}