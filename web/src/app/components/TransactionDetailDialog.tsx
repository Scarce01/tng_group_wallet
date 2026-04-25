import React from 'react';
import { CreditCard, DollarSign, MapPin, Clock } from 'lucide-react';
import svgPaths from '../../imports/TransactionDetail/svg-e2fipup9v8';

interface TransactionDetail {
  id: string;
  type: 'contribution' | 'spending';
  description: string;
  amount: number;
  person: string;
  timestamp: string;
  location?: string;
  category?: string;
  approvers?: string[];
  contributors?: { name: string; amount: number }[];
  notes?: string;
  remainingBalance?: number;
}

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDetail | null;
}

/* ── Avatar colours by initial ── */
const avatarColors: Record<string, { bg: string; text: string }> = {
  A: { bg: 'linear-gradient(135deg, #0055D6 30%, #579DD9 100%)', text: '#fff' },
  S: { bg: '#0D9488', text: '#fff' },
  K: { bg: '#2563EB', text: '#fff' },
  W: { bg: '#7C3AED', text: '#fff' },
  F: { bg: '#2563EB', text: '#fff' },
};
function avatarStyle(name: string) {
  return avatarColors[name.charAt(0).toUpperCase()] ?? { bg: '#0055D6', text: '#fff' };
}

/* ── SVG icons ── */
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p203476e0} stroke="#101828" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.6667 8H3.33333" stroke="#101828" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M9 1L1 9" stroke="#0A0A0A" strokeWidth="1.33" strokeLinecap="round" />
      <path d="M1 1L9 9" stroke="#0A0A0A" strokeWidth="1.33" strokeLinecap="round" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p14548f00} stroke="rgba(255,255,255,0.85)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p17781bc0} stroke="rgba(255,255,255,0.85)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p39ee6532} stroke="rgba(255,255,255,0.85)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4.66667V8L10 10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p25fc4100} stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3e012060} stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckCircleIcon({ color = '#16A34A' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p39ee6532} stroke={color} strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p17134c00} stroke={color} strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckCircleLgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p14d24500} stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3e012060} stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CalcIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p1674e600} stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.33333 5.33333H10.6667" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.33333 8H7.33333"       stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.33333 10.6667H7.33333" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.33333 8H10.6667"       stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.33333 10.6667H10.6667" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18.66 17H1.34L10 2Z" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8V11" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 13.5V14" stroke="#D97706" strokeWidth="2"   strokeLinecap="round" />
    </svg>
  );
}

/* ── Section card wrapper ── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: '14px 16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Small section label ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.06em', marginBottom: 10 }}>
      {children}
    </p>
  );
}

/* ── Main component ── */
export function TransactionDetailDialog({ open, onOpenChange, transaction }: TransactionDetailDialogProps) {
  if (!open || !transaction) return null;

  const totalMembers = transaction.contributors?.length || 4;
  const splitAmount  = transaction.amount / totalMembers;
  const isSpending   = transaction.type === 'spending';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={() => onOpenChange(false)}
      />

      {/* Panel — starts at y=240, scrollable */}
      <div style={{
        position: 'absolute',
        top: 240, left: 0, right: 0, bottom: 0,
        background: '#F5F7FA',
        borderRadius: '24px 24px 0 0',
        border: '0.8px solid rgba(0,0,0,0.1)',
        boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* ── Close (X) button ── */}
        <button
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute', top: 20, right: 18,
            opacity: 0.7, width: 16, height: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <XIcon />
        </button>

        {/* ── Header: back arrow + title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '42px 18px 0' }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeftIcon />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#101828', lineHeight: '28px' }}>
            Transaction Detail
          </span>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '16px 16px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Transaction Header Card */}
          <div style={{
            borderRadius: 16,
            backgroundImage: 'linear-gradient(135deg, #064187 0%, #0059BD 47%, #0A6EB6 74%, #1483AE 100%)',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {isSpending ? <CreditCard size={16} color="#fff" strokeWidth={2} /> : <DollarSign size={16} color="#fff" strokeWidth={2} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{transaction.description}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1, margin: 0 }}>
                  RM {transaction.amount.toFixed(2)}
                </p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 8, padding: '3px 10px',
                fontSize: 10, fontWeight: 700, color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap', marginTop: 2,
              }}>
                {isSpending ? 'Expense' : 'Deposit'}
              </div>
            </div>

            {transaction.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <MapPin size={14} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{transaction.location}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Clock size={14} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{transaction.timestamp}</span>
            </div>
          </div>

          {/* Verified & Group Approved */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#FFFBEB', border: '1.5px solid #FDE68A',
            borderRadius: 14, padding: '10px 16px',
          }}>
            <ShieldIcon />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Verified &amp; Group Approved</span>
          </div>

          {/* Requested By */}
          <Card>
            <Label>REQUESTED BY</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                backgroundImage: avatarStyle(transaction.person).bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{transaction.person.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', margin: 0 }}>{transaction.person}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Transaction initiator</p>
              </div>
            </div>
          </Card>

          {/* Approval Timeline */}
          {transaction.approvers && transaction.approvers.length > 0 && (
            <Card>
              <Label>APPROVAL TIMELINE</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#4B5563' }}>{transaction.person} requested (7:40 PM)</span>
                </div>
                {transaction.approvers.map((approver, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircleIcon color="#16A34A" />
                    <span style={{ fontSize: 13, color: '#101828', fontWeight: 500 }}>
                      {approver} approved (7:{42 + i} PM)
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0055D6' }}>
                    Payment executed (7:44 PM)
                  </span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 10, paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: '#4B5563' }}>
                  <strong>{transaction.approvers.length} of {transaction.approvers.length}</strong> approvals received
                </span>
              </div>
            </Card>
          )}

          {/* Contributors (Auto Split) */}
          {transaction.contributors && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Label>CONTRIBUTORS (AUTO SPLIT)</Label>
                <div style={{
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  borderRadius: 20, padding: '2px 10px',
                  fontSize: 10, fontWeight: 700, color: '#1D4ED8',
                  marginTop: -10,
                }}>
                  {totalMembers} members
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {transaction.contributors.map((c, i) => {
                  const av = avatarStyle(c.name);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            backgroundImage: av.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.name.charAt(0)}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>
                          RM {c.amount.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginLeft: 42 }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #CAA800 0%, #FDDC00 100%)', borderRadius: 2, width: '100%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Payment Source */}
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
            borderRadius: 16, padding: '14px 16px',
          }}>
            <Label>PAYMENT SOURCE</Label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Group Wallet Pool</span>
              <CheckCircleLgIcon />
            </div>
            {transaction.remainingBalance !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #BFDBFE', paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Remaining Balance</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0055D6' }}>
                  RM {transaction.remainingBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Split Logic */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CalcIcon />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.06em' }}>SPLIT LOGIC</span>
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 8px' }}>
              Even split among {totalMembers} members
            </p>
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 10, padding: '10px', textAlign: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                RM {transaction.amount.toFixed(2)} ÷ {totalMembers} = RM {splitAmount.toFixed(2)} each
              </span>
            </div>
          </Card>

          {/* AI Insight */}
          <div style={{
            background: '#FFFBEB', border: '1.5px solid #FDE68A',
            borderRadius: 16, padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              <WarnIcon />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#92400E', letterSpacing: '0.06em', margin: '0 0 4px' }}>
                AI INSIGHT
              </p>
              <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>
                {transaction.notes
                  ? transaction.notes
                  : `This spending is within your ${transaction.category?.toLowerCase() ?? 'accommodation'} budget`}
              </p>
            </div>
          </div>

          {/* Category Badge */}
          {transaction.category && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB',
                borderRadius: 999, padding: '6px 18px',
                fontSize: 12, fontWeight: 600, color: '#374151',
              }}>
                Category: {transaction.category}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
