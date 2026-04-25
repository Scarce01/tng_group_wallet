import React, { useState } from 'react';
import svgPaths from '../../imports/ManageMembers-7/svg-a4rdsgzome';

interface AutoSplitRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  memberCount: number;
}

type SplitMethod = 'equal' | 'percentage' | 'contribution' | 'custom';
type RoundingRule = 'nearest' | 'up' | 'down';

/* ─── SVG icon primitives ─── */

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

function CalcIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p37f49070} stroke="#DBEAFE" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
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

function PercentIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p10a7d900} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.33333 14H12.6667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p13253c0} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4.66667H14V8.66667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p1cbf6000} stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
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
export function AutoSplitRulesDialog({ open, onOpenChange, poolName, memberCount }: AutoSplitRulesDialogProps) {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('nearest');

  if (!open) return null;

  const splitMethods: {
    id: SplitMethod;
    label: string;
    desc: string;
    badge: string;
    badgeBg: string;
    badgeText: string;
    icon: (color: string) => React.ReactElement;
  }[] = [
    {
      id: 'equal',
      label: 'Equal Split',
      desc: `Divide equally among all members`,
      badge: 'Recommended',
      badgeBg: '#DCFCE7',
      badgeText: '#008236',
      icon: (c) => <UsersIcon color={c} />,
    },
    {
      id: 'percentage',
      label: 'Percentage-Based',
      desc: 'Split based on custom percentages',
      badge: 'Flexible',
      badgeBg: '#DBEAFE',
      badgeText: '#1D4ED8',
      icon: (c) => <PercentIcon color={c} />,
    },
    {
      id: 'contribution',
      label: 'Contribution-Based',
      desc: 'Split proportional to contributions',
      badge: 'Fair',
      badgeBg: '#FEF9C2',
      badgeText: '#A65F00',
      icon: (c) => <TrendIcon color={c} />,
    },
    {
      id: 'custom',
      label: 'Custom Amounts',
      desc: 'Set specific amounts per member',
      badge: 'Advanced',
      badgeBg: '#FFE2E2',
      badgeText: '#C10007',
      icon: (c) => <WalletIcon color={c} />,
    },
  ];

  const roundingRules: {
    id: RoundingRule;
    label: string;
    desc: string;
    badge: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    { id: 'nearest', label: 'Round to Nearest', desc: 'RM 20.67 → RM 20.70', badge: 'Recommended', badgeBg: '#DCFCE7', badgeText: '#008236' },
    { id: 'up', label: 'Always Round Up', desc: 'RM 20.61 → RM 20.70', badge: 'Safe', badgeBg: '#FEF9C2', badgeText: '#A65F00' },
    { id: 'down', label: 'Always Round Down', desc: 'RM 20.69 → RM 20.60', badge: 'Lower', badgeBg: '#FFE2E2', badgeText: '#C10007' },
  ];

  const getSplitLabel = () => splitMethods.find(m => m.id === splitMethod)?.label ?? 'Equal Split';
  const getRoundingLabel = () => {
    const map: Record<RoundingRule, string> = { nearest: 'Nearest', up: 'Round Up', down: 'Round Down' };
    return map[roundingRule];
  };
  const getExampleSplit = () => {
    if (splitMethod === 'equal') return `RM ${(100 / memberCount).toFixed(2)} per person`;
    if (splitMethod === 'percentage') return 'Custom % per member';
    if (splitMethod === 'contribution') return 'Proportional to contributions';
    return 'Manually set amounts';
  };

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
        <style>{`.autosplit-noscroll::-webkit-scrollbar{display:none}`}</style>
        <div className="autosplit-noscroll" style={{ overflowY: 'auto' }}>

          {/* ── Close (X) button — top right ── */}
          <button
            onClick={() => onOpenChange(false)}
            style={{
              position: 'absolute', top: 20, right: 18,
              opacity: 0.7, width: 16, height: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <XCloseIcon />
          </button>

          {/* ── Header row: back arrow + "Auto-Split Rules" ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingLeft: 18, paddingTop: 42,
          }}>
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
            <span style={{ fontSize: 18, fontWeight: 700, color: '#101828', lineHeight: '28px', whiteSpace: 'nowrap' }}>
              Auto-Split Rules
            </span>
          </div>

          <div style={{ paddingLeft: 20, paddingRight: 20 }}>

            {/* ── Split Configuration Banner ── */}
            <div style={{
              marginTop: 18,
              borderRadius: 16,
              backgroundImage: 'linear-gradient(165.647403deg, rgb(2, 92, 189) 0%, rgb(18, 116, 177) 100%)',
              height: 98,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 20, left: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CalcIcon />
                <span style={{ fontSize: 14, color: '#DBEAFE', fontWeight: 400, lineHeight: '20px' }}>
                  Split Configuration
                </span>
              </div>
              <div style={{ position: 'absolute', top: 49, left: 20, right: 20 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: '28px' }}>
                  {poolName}
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 10, right: 20 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: '16px' }}>
                  {memberCount} active members
                </span>
              </div>
            </div>

            {/* ── Split Method section ── */}
            <div style={{ marginTop: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px', marginBottom: 10 }}>
                Split Method
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {splitMethods.map((method) => {
                  const selected = splitMethod === method.id;
                  const iconColor = selected ? '#0055D6' : '#364153';
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSplitMethod(method.id)}
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
                        <RadioDot selected={selected} />
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', height: 20, position: 'relative' }}>
                            <div style={{ marginRight: 6 }}>{method.icon(iconColor)}</div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px' }}>
                              {method.label}
                            </span>
                            <div style={{
                              position: 'absolute', right: 0,
                              background: method.badgeBg, borderRadius: 8,
                              padding: '2px 8px',
                              fontSize: 10, fontWeight: 600, color: method.badgeText,
                              lineHeight: '16px', whiteSpace: 'nowrap',
                            }}>
                              {method.badge}
                            </div>
                          </div>
                          <p style={{
                            fontSize: 12, fontWeight: 500, color: '#4A5565',
                            lineHeight: '16px', margin: '4px 0 0 0', whiteSpace: 'nowrap',
                          }}>
                            {method.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Example Split info box ── */}
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
                Example: RM 100 expense → {getExampleSplit()}
              </span>
            </div>

            {/* ── Rounding Rules section ── */}
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px', marginBottom: 0 }}>
                Rounding Rules
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#4A5565', lineHeight: '16px', margin: '8px 0 10px 0' }}>
                How to handle decimal amounts
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roundingRules.map((rule) => {
                  const selected = roundingRule === rule.id;
                  return (
                    <button
                      key={rule.id}
                      onClick={() => setRoundingRule(rule.id)}
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
                        <RadioDot selected={selected} />
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', height: 20, position: 'relative' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#101828', lineHeight: '20px' }}>
                              {rule.label}
                            </span>
                            <div style={{
                              position: 'absolute', right: 0,
                              background: rule.badgeBg, borderRadius: 8,
                              padding: '2px 8px',
                              fontSize: 10, fontWeight: 600, color: rule.badgeText,
                              lineHeight: '16px', whiteSpace: 'nowrap',
                            }}>
                              {rule.badge}
                            </div>
                          </div>
                          <p style={{
                            fontSize: 12, fontWeight: 500, color: '#4A5565',
                            lineHeight: '16px', margin: '4px 0 0 0',
                          }}>
                            {rule.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Current Configuration ── */}
            <div style={{
              marginTop: 20,
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
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Split Method:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>{getSplitLabel()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Members:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>{memberCount} active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', lineHeight: '16px' }}>Rounding:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', lineHeight: '16px' }}>{getRoundingLabel()}</span>
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